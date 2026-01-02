/*
  # Seed Initial Data for 1991 Honda NSX

  1. Adds 1991 Honda NSX as initial vehicle
  2. Adds parts list with pricing and suppliers
  3. Adds inspection checklist items
  4. Adds diagnostic procedures
  5. Adds video library references
  6. Adds service reminders
*/

DO $$
DECLARE
  v_nsx_id uuid;
BEGIN
  INSERT INTO vehicles (make, model, year, engine, transmission, current_mileage, notes)
  VALUES ('Honda', 'NSX', 1991, '3.0L C30A', 'Manual Transmission', 0, '1991 Honda NSX with manual transmission')
  RETURNING id INTO v_nsx_id;

  INSERT INTO parts (vehicle_id, name, specifications, supplier_name, purchase_link, price_eur, category, compatibility_notes)
  VALUES
    (v_nsx_id, 'Engine Oil', '0W-40 Synthetic', 'Honda Parts Direct', 'https://www.hondapartssdirect.com', 70.00, 'Fluids', 'Recommended for 3.0L C30A engine'),
    (v_nsx_id, 'Honda MTF-3 Transmission Oil', 'Manual Transmission Fluid', 'Honda Parts Direct', 'https://www.hondapartssdirect.com', 25.00, 'Fluids', 'OEM transmission fluid for manual gearbox'),
    (v_nsx_id, 'Honda Type 2 Coolant', 'Engine Coolant', 'Honda Parts Direct', 'https://www.hondapartssdirect.com', 100.00, 'Fluids', 'Premium coolant for NSX cooling system'),
    (v_nsx_id, 'Coolant Hose Kit for RHD M/T', 'Right-hand drive manual transmission', 'Honda Specialist', 'https://www.hondaspecialist.com', 800.00, 'Cooling System', 'Specific to RHD manual transmission models'),
    (v_nsx_id, 'Thermostat Assembly', 'Complete thermostat unit with housing', 'OEM Parts Supplier', 'https://www.oemparts.com', 72.00, 'Cooling System', 'Maintains optimal engine temperature'),
    (v_nsx_id, 'NGK Laser Platinum Spark Plugs', 'Set of 6 plugs, part # PFR7G-11', 'NGK Official', 'https://www.ngksparkplugs.com', 115.00, 'Engine Maintenance', 'Premium spark plugs for C30A engine'),
    (v_nsx_id, 'Complete Service Kit', 'Includes timing belt, water pump, belts, gaskets, filters', 'Honda Specialist', 'https://www.hondaspecialist.com', 1415.00, 'Engine Maintenance', 'Comprehensive maintenance kit'),
    (v_nsx_id, 'Timing Belt Adjuster Pulley', 'Tensioner pulley for timing belt', 'Auto Parts Shop', 'https://www.autopartsshop.com', 140.00, 'Engine Maintenance', 'Optional but recommended component'),
    (v_nsx_id, 'Lower Timing Belt Cover Kit', 'Bottom timing cover assembly', 'Honda Parts Direct', 'https://www.hondapartssdirect.com', 234.00, 'Engine Maintenance', 'Protects timing belt from debris'),
    (v_nsx_id, 'Camshaft Seals', 'Front camshaft seals (pair)', 'OEM Parts Supplier', 'https://www.oemparts.com', 124.00, 'Engine Maintenance', 'Prevents oil leaks from camshaft'),
    (v_nsx_id, 'Fuel Filter', 'In-tank fuel filter assembly', 'Auto Fuel Systems', 'https://www.autofuelsystems.com', 95.00, 'Fuel System', 'Ensures clean fuel delivery'),
    (v_nsx_id, 'Braided Brake Lines', 'Stainless steel braided lines (complete set)', 'Performance Brakes Co', 'https://www.performancebrakes.com', 107.00, 'Brake System', 'Improves brake line durability'),
    (v_nsx_id, 'Hawk Brake Pads', 'High-performance brake pads', 'Hawk Performance', 'https://www.hawkperformance.com', 226.00, 'Brake System', 'Premium braking performance');

  INSERT INTO inspection_templates (vehicle_id, title, description, category, is_priority, specifications)
  VALUES
    (v_nsx_id, 'Bushings and Pipes', 'Check all suspension bushings for wear and cracks', 'Suspension', false, 'Inspect rubber for deterioration'),
    (v_nsx_id, 'Engine Sensors', 'Inspect all engine sensors for corrosion and damage', 'Engine', true, 'Check O2 sensors and MAP sensor'),
    (v_nsx_id, 'Battery Terminal Condition', 'Check battery terminal connections for corrosion', 'Electrical', true, 'Clean and verify secure connections'),
    (v_nsx_id, 'Alternator Service', 'Verify alternator function and belt condition', 'Electrical', false, 'Check charging output'),
    (v_nsx_id, 'O2 Sensor 1', 'Upstream oxygen sensor (before catalytic converter)', 'Emissions', true, 'Critical for emissions and fuel trim'),
    (v_nsx_id, 'O2 Sensor 2', 'Downstream oxygen sensor (after catalytic converter)', 'Emissions', true, 'Validates catalytic converter function'),
    (v_nsx_id, 'MAP Sensor', 'Manifold Absolute Pressure sensor functionality', 'Engine', true, 'Essential for fuel mapping'),
    (v_nsx_id, 'TPS Sensor', 'Throttle Position Sensor operation', 'Engine', true, 'Affects engine response'),
    (v_nsx_id, 'Coolant Level', 'Check coolant level and condition', 'Cooling System', false, 'Top up if necessary'),
    (v_nsx_id, 'Fluid Leaks', 'Inspect for oil, coolant, and transmission fluid leaks', 'General', false, 'Check ground under vehicle');

  INSERT INTO diagnostic_procedures (vehicle_id, title, system, description, steps, warnings, related_part_ids)
  VALUES
    (v_nsx_id, 'Catalytic Converter Diagnosis', 'Emissions', 'Diagnose catalytic converter issues using O2 sensor readings', 'Step 1: Connect OBD-II scanner. Step 2: Record O2 sensor voltages before and after converter. Step 3: Compare readings. Step 4: If downstream sensor not responding to load, converter may be clogged.', 'CAUTION: Catalytic converter is extremely hot after engine running. Allow cooldown time.', '{}'),
    (v_nsx_id, 'Check Engine Light Diagnosis', 'Engine Control', 'Systematic approach to diagnosing check engine light codes', 'Step 1: Connect OBD-II scanner. Step 2: Read all active and pending codes. Step 3: Note freeze frame data. Step 4: Consult diagnostic guide for code meanings. Step 5: Perform tests per code requirements.', 'WARNING: Do not ignore persistent codes. Multiple codes may indicate a primary issue causing secondary faults.', '{}'),
    (v_nsx_id, 'O2 Sensor Replacement', 'Emissions', 'Step-by-step O2 sensor replacement procedure', 'Step 1: Locate sensor (before and/or after catalytic converter). Step 2: Allow engine to cool. Step 3: Disconnect electrical connector. Step 4: Remove sensor with O2 sensor socket. Step 5: Apply anti-seize compound to new sensor. Step 6: Install and tighten. Step 7: Reconnect connector. Step 8: Clear codes and test.', 'CAUTION: Exhaust manifold is extremely hot. Wear heat protection. Use proper O2 sensor socket to avoid damage.', '{}'),
    (v_nsx_id, 'Terminal Connection Inspection', 'Electrical', 'Verify all electrical connections and terminal quality', 'Step 1: Inspect battery terminals for corrosion. Step 2: Check alternator connector security. Step 3: Verify ground connections at engine block. Step 4: Inspect all sensor connectors for corrosion. Step 5: Test resistance of corroded connections with multimeter.', 'WARNING: Disconnect battery negative terminal before working on electrical connections.', '{}'),
    (v_nsx_id, 'Ground Check Procedure', 'Electrical', 'Verify critical ground connections throughout vehicle', 'Step 1: Identify ground points (engine block, chassis, battery negative). Step 2: Clean all ground points to bare metal. Step 3: Measure resistance between ground points with multimeter. Step 4: Should be less than 0.1 ohms. Step 5: If higher, clean and reconnect.', 'WARNING: All grounds must be clean and secure for proper engine operation.', '{}');

  INSERT INTO video_library (title, category, vehicle_id, youtube_link, description, difficulty_level)
  VALUES
    ('NSX Routine Maintenance Overview', 'General Service', v_nsx_id, 'https://www.youtube.com/watch?v=example1', 'Introduction to basic NSX maintenance procedures', 'Beginner'),
    ('Oil and Filter Change', 'General Service', v_nsx_id, 'https://www.youtube.com/watch?v=example2', 'Complete oil change procedure for 1991 NSX', 'Beginner'),
    ('Timing Belt Service Part 1: Removal Prep', 'Timing Belt Service', v_nsx_id, 'https://www.youtube.com/watch?v=example3', 'Preparation and initial removal steps', 'Intermediate'),
    ('Timing Belt Service Part 2: Crankshaft Pulley', 'Timing Belt Service', v_nsx_id, 'https://www.youtube.com/watch?v=example4', 'Removing crankshaft pulley safely', 'Intermediate'),
    ('Timing Belt Service Part 3: Timing Belt Removal', 'Timing Belt Service', v_nsx_id, 'https://www.youtube.com/watch?v=example5', 'Removing the timing belt', 'Intermediate'),
    ('Timing Belt Service Part 4: Water Pump Replacement', 'Timing Belt Service', v_nsx_id, 'https://www.youtube.com/watch?v=example6', 'Replacing water pump during timing belt service', 'Advanced'),
    ('Timing Belt Service Part 5: Installation', 'Timing Belt Service', v_nsx_id, 'https://www.youtube.com/watch?v=example7', 'Installing new timing belt and setting tension', 'Advanced'),
    ('Timing Belt Service Part 6: Reassembly', 'Timing Belt Service', v_nsx_id, 'https://www.youtube.com/watch?v=example8', 'Reassembling components and verifying alignment', 'Advanced'),
    ('Timing Belt Service Part 7: Final Setup and Testing', 'Timing Belt Service', v_nsx_id, 'https://www.youtube.com/watch?v=example9', 'Final reassembly, timing verification, and road test', 'Advanced');

  INSERT INTO service_reminders (vehicle_id, service_type, mileage_interval, last_service_mileage)
  VALUES
    (v_nsx_id, 'Oil and Filter Change', 5000, 0),
    (v_nsx_id, 'Coolant Level Check', 10000, 0),
    (v_nsx_id, 'Transmission Fluid Check', 10000, 0),
    (v_nsx_id, 'Brake Inspection', 15000, 0),
    (v_nsx_id, 'Timing Belt Service', 100000, 0),
    (v_nsx_id, 'Spark Plug Replacement', 30000, 0),
    (v_nsx_id, 'Suspension Inspection', 20000, 0);
END $$;