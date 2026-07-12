import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

/**
 * Gather real-time telemetry from remote database to inject into AI context
 */
async function gatherFleetTelemetrySnapshot() {
  try {
    const [
      maintenanceVehicles,
      availableDrivers,
      expiringLicenses,
      fuelConsumption,
      vehicleStatuses,
      financialSummary,
      activeTrips
    ] = await Promise.all([
      // 1. Vehicles under maintenance or in shop
      queryDb(`
        SELECT v.id, v.registration_number, v.vehicle_name, vc.name as category, v.status,
               m.maintenance_type, m.description, m.priority, m.scheduled_date, m.cost
        FROM vehicle v
        LEFT JOIN vehicle_category vc ON v.category_id = vc.id
        LEFT JOIN maintenance m ON v.id = m.vehicle_id AND m.status = 'ACTIVE'
        WHERE v.status = 'IN_SHOP' OR m.status = 'ACTIVE'
      `),
      // 2. Available drivers
      queryDb(`
        SELECT d.id, d.employee_code, u.name, d.phone, d.license_number, d.license_type, d.safety_score, d.status
        FROM driver d
        JOIN user u ON d.user_id = u.id
        WHERE d.status = 'AVAILABLE'
      `),
      // 3. Licenses expiring in next 45 days (or already expired)
      queryDb(`
        SELECT u.name, d.employee_code, d.license_number, d.license_type, d.license_expiry
        FROM driver d
        JOIN user u ON d.user_id = u.id
        WHERE d.license_expiry <= DATE_ADD(CURRENT_DATE, INTERVAL 45 DAY)
        ORDER BY d.license_expiry ASC
      `),
      // 4. Highest fuel-consuming vehicles
      queryDb(`
        SELECT v.registration_number, v.vehicle_name,
               COALESCE(SUM(f.liters), 0) as total_liters,
               COALESCE(SUM(f.total_cost), 0) as total_fuel_cost
        FROM vehicle v
        LEFT JOIN fuel_log f ON v.id = f.vehicle_id
        GROUP BY v.id, v.registration_number, v.vehicle_name
        ORDER BY total_liters DESC
        LIMIT 6
      `),
      // 5. Fleet utilization (count by status)
      queryDb(`
        SELECT status, COUNT(*) as count FROM vehicle GROUP BY status
      `),
      // 6. Operational cost summary
      queryDb(`
        SELECT
          (SELECT COALESCE(SUM(cost), 0) FROM maintenance) as total_maintenance_cost,
          (SELECT COALESCE(SUM(total_cost), 0) FROM fuel_log) as total_fuel_cost,
          (SELECT COALESCE(SUM(amount), 0) FROM expense) as total_other_expenses,
          (SELECT COALESCE(SUM(revenue), 0) FROM trip WHERE status = 'COMPLETED') as total_trip_revenue
      `),
      // 7. Active or Dispatched trips
      queryDb(`
        SELECT t.trip_number, v.registration_number as vehicle, u.name as driver,
               t.source, t.destination, t.cargo_weight, t.status
        FROM trip t
        JOIN vehicle v ON t.vehicle_id = v.id
        JOIN driver d ON t.driver_id = d.id
        JOIN user u ON d.user_id = u.id
        WHERE t.status IN ('DISPATCHED', 'DRAFT')
        LIMIT 10
      `)
    ]);

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      vehiclesUnderMaintenance: maintenanceVehicles || [],
      availableDrivers: availableDrivers || [],
      licensesExpiringSoon: expiringLicenses || [],
      topFuelConsumingVehicles: fuelConsumption || [],
      fleetUtilizationByStatus: vehicleStatuses || [],
      financialCostAndRevenueSummary: (financialSummary && financialSummary[0]) || {},
      activeTrips: activeTrips || []
    }, null, 2);
  } catch (err) {
    console.error('[Telemetry Snapshot Error]:', err);
    return JSON.stringify({ error: 'Failed to query live telemetry data', details: err.message });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Invalid token session.' }, { status: 401 });
    }

    const { question, history = [] } = await request.json();
    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Please enter a valid question or prompt.' }, { status: 400 });
    }

    // 1. Gather live database telemetry
    const telemetrySnapshot = await gatherFleetTelemetrySnapshot();

    // 2. Prepare Groq API call
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'GROQ_API_KEY is missing from environment variables (.env.local).'
      }, { status: 500 });
    }

    const systemPrompt = `You are the **TransitOps AI Fleet Telemetry Assistant**, a highly intelligent, precise, and professional AI embedded directly inside the TransitOps Enterprise Command Center.
Your purpose is to answer operational queries from Fleet Managers, Admins, Safety Officers, and Drivers based STRICTLY on the live database telemetry snapshot injected below.

CRITICAL RULES & GUIDELINES:
1. **EXACT DATA CITATION:** Never invent, fabricate, or guess numbers, driver names, vehicle registrations, or costs. Answer directly from the exact JSON telemetry data provided in [LIVE FLEET TELEMETRY SNAPSHOT].
2. **CLEAR FORMATTING:** Format your response cleanly using GitHub-Flavored Markdown:
   - Use bolding (` + '`**text**`' + `) for important metrics, vehicle registration numbers, driver names, and monetary values.
   - Use bullet points (` + '`-`' + `) for lists.
   - When presenting 2 or more comparative records (e.g. vehicles, drivers, expenses), format them cleanly in a **Markdown Table**.
3. **CONCISE & ACTIONABLE:** Give direct answers first. If answering a question about maintenance or expiring licenses, highlight any critical items or immediate safety concerns.
4. **NO TELEMETRY FOUND:** If the telemetry snapshot indicates 0 items for a category (e.g., no vehicles currently in shop), explicitly state that: *"Currently, there are 0 vehicles in the shop or under active maintenance according to live database records."*`;

    const userPromptWithContext = `[LIVE FLEET TELEMETRY SNAPSHOT @ ${new Date().toISOString()}]
\`\`\`json
${telemetrySnapshot}
\`\`\`

[USER QUESTION]
${question.trim()}`;

    // Construct conversation history for Llama
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Include up to last 4 user/assistant turns if present for context continuity
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-4);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: 'user', content: userPromptWithContext });

    // Call Groq Llama 3.3 70B Versatile
    let groqResponse;
    try {
      groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: messages,
          temperature: 0.2, // Low temp for factual precision
          max_tokens: 1500
        })
      });

      // If 70B model fails or rate limits, fallback to 8B instant
      if (!groqResponse.ok && groqResponse.status === 429) {
        console.warn('[Groq 70B Rate Limited, falling back to 8B instant]');
        groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: messages,
            temperature: 0.2,
            max_tokens: 1500
          })
        });
      }
    } catch (fetchErr) {
      console.error('[Groq Network Error]:', fetchErr);
      return NextResponse.json({ error: 'Failed to connect to Groq AI inference servers.' }, { status: 502 });
    }

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('[Groq API Error Response]:', groqResponse.status, errText);
      return NextResponse.json({ error: `Groq AI error (${groqResponse.status}): ${errText}` }, { status: 500 });
    }

    const data = await groqResponse.json();
    const aiText = data.choices?.[0]?.message?.content || 'I could not generate an analysis based on the current telemetry.';

    // 3. Save interaction to database chat table
    try {
      await queryDb(
        'INSERT INTO chat (user_id, question, response, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [user.userId, question.trim(), aiText]
      );
    } catch (dbErr) {
      console.warn('[Failed to log chat to database]:', dbErr.message);
      // Non-fatal, return response anyway
    }

    return NextResponse.json({
      success: true,
      response: aiText,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (err) {
    console.error('[POST /api/ai/chat Fatal Error]:', err);
    return NextResponse.json({ error: 'An internal error occurred while generating the AI response.' }, { status: 500 });
  }
}
