import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://husbupeealwuxyopfwwb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c2J1cGVlYWx3dXh5b3Bmd3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTE3ODMsImV4cCI6MjA3NDUyNzc4M30.ERC3k2pHFZ0MOmrbcSAgS1FwTIMpMh0fKbgzLuMXP6s';

const supabase = createClient(supabaseUrl, supabaseKey);

const allData = [
  { code: 'A-DISCONNECT-60A', name: 'Disconnect 60A', category: 'Disconnects', qty: 22, reserved: 3, cost: 68.00, location: 'Main', bin: 'I1', reorder: 4, reorderQty: 11 },
  { code: 'A-DISCONNECT-100A', name: 'Disconnect 100A', category: 'Disconnects', qty: 15, reserved: 2, cost: 125.00, location: 'Main', bin: 'I1', reorder: 3, reorderQty: 8 },
  { code: 'A-FUSE-10A', name: 'Fuse 10A', category: 'Fuses', qty: 75, reserved: 5, cost: 3.50, location: 'Main', bin: 'J1', reorder: 15, reorderQty: 38 },
  { code: 'A-FUSE-15A', name: 'Fuse 15A', category: 'Fuses', qty: 90, reserved: 10, cost: 3.75, location: 'Main', bin: 'J1', reorder: 18, reorderQty: 45 },
  { code: 'A-FUSE-20A', name: 'Fuse 20A', category: 'Fuses', qty: 65, reserved: 8, cost: 4.00, location: 'Main', bin: 'J1', reorder: 13, reorderQty: 33 },
  { code: 'A-GROUND-ROD-8FT', name: 'Ground Rod 8 ft', category: 'Grounding', qty: 45, reserved: 5, cost: 18.50, location: 'Main', bin: 'K1', reorder: 9, reorderQty: 23 },
  { code: 'A-GROUND-CLAMP', name: 'Ground Clamp', category: 'Grounding', qty: 120, reserved: 15, cost: 4.25, location: 'Main', bin: 'K1', reorder: 24, reorderQty: 60 },
  { code: 'A-INVERTER-5KW', name: 'Inverter 5kW', category: 'Inverters', qty: 6, reserved: 1, cost: 1850.00, location: 'Main', bin: 'L1', reorder: 1, reorderQty: 3 },
  { code: 'A-INVERTER-7.6KW', name: 'Inverter 7.6kW', category: 'Inverters', qty: 8, reserved: 2, cost: 2450.00, location: 'Main', bin: 'L1', reorder: 2, reorderQty: 4 },
  { code: 'A-INVERTER-10KW', name: 'Inverter 10kW', category: 'Inverters', qty: 4, reserved: 1, cost: 3200.00, location: 'Main', bin: 'L1', reorder: 1, reorderQty: 2 },
  { code: 'A-JUNCTION-BOX-4X4', name: 'Junction Box 4x4', category: 'Boxes', qty: 150, reserved: 20, cost: 2.85, location: 'Main', bin: 'M1', reorder: 30, reorderQty: 75 },
  { code: 'A-JUNCTION-BOX-6X6', name: 'Junction Box 6x6', category: 'Boxes', qty: 100, reserved: 15, cost: 4.50, location: 'Main', bin: 'M1', reorder: 20, reorderQty: 50 },
  { code: 'A-METER-SOCKET', name: 'Meter Socket', category: 'Meters', qty: 12, reserved: 2, cost: 95.00, location: 'Main', bin: 'N1', reorder: 2, reorderQty: 6 },
  { code: 'A-MODULE-400W', name: 'Solar Module 400W', category: 'Modules', qty: 250, reserved: 40, cost: 185.00, location: 'Warehouse A', bin: 'SOLAR-1', reorder: 50, reorderQty: 125 },
  { code: 'A-MODULE-450W', name: 'Solar Module 450W', category: 'Modules', qty: 180, reserved: 30, cost: 210.00, location: 'Warehouse A', bin: 'SOLAR-1', reorder: 36, reorderQty: 90 },
  { code: 'A-MODULE-500W', name: 'Solar Module 500W', category: 'Modules', qty: 120, reserved: 20, cost: 245.00, location: 'Warehouse A', bin: 'SOLAR-2', reorder: 24, reorderQty: 60 },
  { code: 'A-OPTIMIZER', name: 'Power Optimizer', category: 'Optimizers', qty: 350, reserved: 50, cost: 68.00, location: 'Main', bin: 'O1', reorder: 70, reorderQty: 175 },
  { code: 'A-PANEL-100A', name: 'Electrical Panel 100A', category: 'Panels', qty: 8, reserved: 1, cost: 285.00, location: 'Main', bin: 'P1', reorder: 2, reorderQty: 4 },
  { code: 'A-PANEL-200A', name: 'Electrical Panel 200A', category: 'Panels', qty: 6, reserved: 1, cost: 425.00, location: 'Main', bin: 'P1', reorder: 1, reorderQty: 3 },
  { code: 'A-RAIL-165', name: 'Rail 165 inch', category: 'Racking', qty: 300, reserved: 40, cost: 42.00, location: 'Warehouse B', bin: 'RACK-1', reorder: 60, reorderQty: 150 },
  { code: 'A-RAIL-185', name: 'Rail 185 inch', category: 'Racking', qty: 250, reserved: 35, cost: 48.00, location: 'Warehouse B', bin: 'RACK-1', reorder: 50, reorderQty: 125 },
  { code: 'A-CLAMP-MID', name: 'Mid Clamp', category: 'Racking', qty: 800, reserved: 100, cost: 3.25, location: 'Warehouse B', bin: 'RACK-2', reorder: 160, reorderQty: 400 },
  { code: 'A-CLAMP-END', name: 'End Clamp', category: 'Racking', qty: 600, reserved: 80, cost: 3.75, location: 'Warehouse B', bin: 'RACK-2', reorder: 120, reorderQty: 300 },
  { code: 'A-SPLICE-KIT', name: 'Rail Splice Kit', category: 'Racking', qty: 120, reserved: 15, cost: 12.50, location: 'Warehouse B', bin: 'RACK-2', reorder: 24, reorderQty: 60 },
  { code: 'A-L-FOOT', name: 'L-Foot Attachment', category: 'Racking', qty: 200, reserved: 25, cost: 8.75, location: 'Warehouse B', bin: 'RACK-3', reorder: 40, reorderQty: 100 },
  { code: 'A-FLASHING-STD', name: 'Roof Flashing Standard', category: 'Racking', qty: 150, reserved: 20, cost: 15.50, location: 'Warehouse B', bin: 'RACK-3', reorder: 30, reorderQty: 75 },
  { code: 'A-WIRE-10AWG-BLK', name: 'Wire 10 AWG Black', category: 'Wire', qty: 5000, reserved: 500, cost: 0.85, location: 'Main', bin: 'W1', reorder: 1000, reorderQty: 2500 },
  { code: 'A-WIRE-10AWG-RED', name: 'Wire 10 AWG Red', category: 'Wire', qty: 5000, reserved: 500, cost: 0.85, location: 'Main', bin: 'W1', reorder: 1000, reorderQty: 2500 },
  { code: 'A-WIRE-10AWG-WHT', name: 'Wire 10 AWG White', category: 'Wire', qty: 4500, reserved: 450, cost: 0.85, location: 'Main', bin: 'W1', reorder: 900, reorderQty: 2250 },
  { code: 'A-WIRE-10AWG-GRN', name: 'Wire 10 AWG Green', category: 'Wire', qty: 4000, reserved: 400, cost: 0.85, location: 'Main', bin: 'W1', reorder: 800, reorderQty: 2000 },
  { code: 'A-WIRE-6AWG-BLK', name: 'Wire 6 AWG Black', category: 'Wire', qty: 3000, reserved: 300, cost: 1.45, location: 'Main', bin: 'W2', reorder: 600, reorderQty: 1500 },
  { code: 'A-WIRE-6AWG-RED', name: 'Wire 6 AWG Red', category: 'Wire', qty: 3000, reserved: 300, cost: 1.45, location: 'Main', bin: 'W2', reorder: 600, reorderQty: 1500 },
  { code: 'A-WIRE-4AWG-BLK', name: 'Wire 4 AWG Black', category: 'Wire', qty: 2000, reserved: 200, cost: 2.15, location: 'Main', bin: 'W3', reorder: 400, reorderQty: 1000 },
  { code: 'A-WIRE-4AWG-RED', name: 'Wire 4 AWG Red', category: 'Wire', qty: 2000, reserved: 200, cost: 2.15, location: 'Main', bin: 'W3', reorder: 400, reorderQty: 1000 },
  { code: 'A-WIRE-2AWG-BLK', name: 'Wire 2 AWG Black', category: 'Wire', qty: 1500, reserved: 150, cost: 3.25, location: 'Main', bin: 'W4', reorder: 300, reorderQty: 750 },
  { code: 'A-WIRE-2AWG-RED', name: 'Wire 2 AWG Red', category: 'Wire', qty: 1500, reserved: 150, cost: 3.25, location: 'Main', bin: 'W4', reorder: 300, reorderQty: 750 },
  { code: 'A-WIRE-NUT-RED', name: 'Wire Nut Red', category: 'Connectors', qty: 2000, reserved: 200, cost: 0.15, location: 'Main', bin: 'H2', reorder: 400, reorderQty: 1000 },
  { code: 'A-WIRE-NUT-BLUE', name: 'Wire Nut Blue', category: 'Connectors', qty: 1500, reserved: 150, cost: 0.18, location: 'Main', bin: 'H2', reorder: 300, reorderQty: 750 },
  { code: 'A-WIRE-NUT-YELLOW', name: 'Wire Nut Yellow', category: 'Connectors', qty: 1800, reserved: 180, cost: 0.20, location: 'Main', bin: 'H2', reorder: 360, reorderQty: 900 },
  { code: 'A-TAPE-ELECT-BLK', name: 'Electrical Tape Black', category: 'Supplies', qty: 250, reserved: 25, cost: 2.50, location: 'Main', bin: 'S1', reorder: 50, reorderQty: 125 },
  { code: 'A-TAPE-ELECT-RED', name: 'Electrical Tape Red', category: 'Supplies', qty: 150, reserved: 15, cost: 2.50, location: 'Main', bin: 'S1', reorder: 30, reorderQty: 75 },
  { code: 'A-SILICONE-CLEAR', name: 'Silicone Sealant Clear', category: 'Supplies', qty: 80, reserved: 10, cost: 6.75, location: 'Main', bin: 'S2', reorder: 16, reorderQty: 40 },
  { code: 'A-SILICONE-BLACK', name: 'Silicone Sealant Black', category: 'Supplies', qty: 65, reserved: 8, cost: 6.75, location: 'Main', bin: 'S2', reorder: 13, reorderQty: 33 },
  { code: 'A-SCREWS-WOOD-2.5', name: 'Wood Screws 2.5 inch', category: 'Fasteners', qty: 5000, reserved: 500, cost: 0.08, location: 'Main', bin: 'F2', reorder: 1000, reorderQty: 2500 },
  { code: 'A-SCREWS-WOOD-3', name: 'Wood Screws 3 inch', category: 'Fasteners', qty: 4000, reserved: 400, cost: 0.10, location: 'Main', bin: 'F2', reorder: 800, reorderQty: 2000 },
  { code: 'A-LAG-BOLT-3/8', name: 'Lag Bolt 3/8 inch', category: 'Fasteners', qty: 1000, reserved: 100, cost: 0.45, location: 'Main', bin: 'F3', reorder: 200, reorderQty: 500 },
  { code: 'A-LAG-BOLT-1/2', name: 'Lag Bolt 1/2 inch', category: 'Fasteners', qty: 800, reserved: 80, cost: 0.65, location: 'Main', bin: 'F3', reorder: 160, reorderQty: 400 },
  { code: 'A-WASHER-3/8', name: 'Washer 3/8 inch', category: 'Fasteners', qty: 2000, reserved: 200, cost: 0.08, location: 'Main', bin: 'F4', reorder: 400, reorderQty: 1000 },
  { code: 'A-WASHER-1/2', name: 'Washer 1/2 inch', category: 'Fasteners', qty: 1800, reserved: 180, cost: 0.10, location: 'Main', bin: 'F4', reorder: 360, reorderQty: 900 },
  { code: 'A-COMBINER-BOX-3', name: 'Combiner Box 3 String', category: 'Boxes', qty: 15, reserved: 2, cost: 125.00, location: 'Main', bin: 'M2', reorder: 3, reorderQty: 8 },
  { code: 'A-COMBINER-BOX-6', name: 'Combiner Box 6 String', category: 'Boxes', qty: 12, reserved: 2, cost: 185.00, location: 'Main', bin: 'M2', reorder: 2, reorderQty: 6 },
  { code: 'A-MONITORING-GATEWAY', name: 'Monitoring Gateway', category: 'Monitoring', qty: 20, reserved: 3, cost: 285.00, location: 'Main', bin: 'T1', reorder: 4, reorderQty: 10 },
  { code: 'A-RAPID-SHUTDOWN', name: 'Rapid Shutdown Device', category: 'Safety', qty: 35, reserved: 5, cost: 95.00, location: 'Main', bin: 'B3', reorder: 7, reorderQty: 18 },
  { code: 'A-SAFETY-HARNESS', name: 'Safety Harness', category: 'Safety', qty: 12, reserved: 2, cost: 145.00, location: 'Main', bin: 'B1', reorder: 2, reorderQty: 6 },
  { code: 'A-HARD-HAT', name: 'Hard Hat', category: 'Safety', qty: 25, reserved: 0, cost: 18.50, location: 'Main', bin: 'B1', reorder: 5, reorderQty: 13 },
  { code: 'A-SAFETY-GLASSES', name: 'Safety Glasses', category: 'Safety', qty: 40, reserved: 0, cost: 8.75, location: 'Main', bin: 'B1', reorder: 8, reorderQty: 20 },
  { code: 'A-GLOVES-WORK', name: 'Work Gloves', category: 'Safety', qty: 60, reserved: 5, cost: 12.50, location: 'Main', bin: 'B1', reorder: 12, reorderQty: 30 },
  { code: 'A-LADDER-28FT', name: 'Extension Ladder 28 ft', category: 'Tools', qty: 4, reserved: 1, cost: 425.00, location: 'Tools', bin: 'TOOL-1', reorder: 1, reorderQty: 2 },
  { code: 'A-DRILL-IMPACT', name: 'Impact Drill Kit', category: 'Tools', qty: 8, reserved: 2, cost: 285.00, location: 'Tools', bin: 'TOOL-2', reorder: 2, reorderQty: 4 },
  { code: 'A-MULTIMETER', name: 'Digital Multimeter', category: 'Tools', qty: 15, reserved: 3, cost: 95.00, location: 'Tools', bin: 'TOOL-3', reorder: 3, reorderQty: 8 }
];

async function importBatch() {
  console.log('Importing remaining inventory items...\n');

  for (const item of allData) {
    const record = {
      product_code: item.code,
      product_name: item.name,
      category: item.category,
      quantity_on_hand: item.qty,
      quantity_reserved: item.reserved,
      unit_cost: item.cost,
      location: item.location,
      bin_location: item.bin,
      reorder_point: item.reorder,
      reorder_quantity: item.reorderQty,
      supplier_name: 'Primary Supplier',
      excel_source_file: '/Shared/Warehouse/Warehouse Pull Spreadsheet V28.xlsm'
    };

    const { error } = await supabase
      .from('warehouse_inventory')
      .upsert(record, { onConflict: 'product_code' });

    if (error) {
      console.error(`Error importing ${item.code}:`, error.message);
    } else {
      console.log(`✓ ${item.code}`);
    }
  }

  console.log('\n✓ Import complete!');
}

importBatch();
