import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const inventoryData = [
  { code: 'A-ADAPTER-10-250', name: 'adapter 10-250', category: 'Adapters', qty: 4, reserved: 0, cost: 25.00, location: 'Main', bin: 'A1' },
  { code: 'A-ADAPTER-6-250', name: 'adapter 6-250', category: 'Adapters', qty: 6, reserved: 0, cost: 20.00, location: 'Main', bin: 'A1' },
  { code: 'A-ASBTOS-BAG-50LBS', name: 'Asbestos Bags 50 LBS', category: 'Safety', qty: 4, reserved: 0, cost: 8.50, location: 'Main', bin: 'B2' },
  { code: 'A-BAT-200', name: 'Battery 200 AH', category: 'Batteries', qty: 12, reserved: 2, cost: 450.00, location: 'Main', bin: 'C1' },
  { code: 'A-BAT-250', name: 'Battery 250 AH', category: 'Batteries', qty: 8, reserved: 1, cost: 520.00, location: 'Main', bin: 'C1' },
  { code: 'A-BAT-CABLE-2/0', name: 'Battery Cable 2/0', category: 'Cables', qty: 500, reserved: 50, cost: 3.25, location: 'Main', bin: 'D1' },
  { code: 'A-BAT-CABLE-4/0', name: 'Battery Cable 4/0', category: 'Cables', qty: 350, reserved: 30, cost: 4.50, location: 'Main', bin: 'D1' },
  { code: 'A-BRACKET-L-6IN', name: 'L-Bracket 6 inch', category: 'Brackets', qty: 200, reserved: 20, cost: 2.75, location: 'Main', bin: 'E1' },
  { code: 'A-BRACKET-L-8IN', name: 'L-Bracket 8 inch', category: 'Brackets', qty: 150, reserved: 15, cost: 3.25, location: 'Main', bin: 'E1' },
  { code: 'A-BREAKER-15A', name: 'Circuit Breaker 15A', category: 'Breakers', qty: 45, reserved: 5, cost: 12.50, location: 'Main', bin: 'F1' },
  { code: 'A-BREAKER-20A', name: 'Circuit Breaker 20A', category: 'Breakers', qty: 60, reserved: 8, cost: 14.00, location: 'Main', bin: 'F1' },
  { code: 'A-BREAKER-30A', name: 'Circuit Breaker 30A', category: 'Breakers', qty: 38, reserved: 4, cost: 16.50, location: 'Main', bin: 'F1' },
  { code: 'A-BREAKER-50A', name: 'Circuit Breaker 50A', category: 'Breakers', qty: 25, reserved: 3, cost: 22.00, location: 'Main', bin: 'F1' },
  { code: 'A-CONDUIT-EMT-1/2', name: 'EMT Conduit 1/2 inch', category: 'Conduit', qty: 120, reserved: 15, cost: 8.75, location: 'Main', bin: 'G1' },
  { code: 'A-CONDUIT-EMT-3/4', name: 'EMT Conduit 3/4 inch', category: 'Conduit', qty: 95, reserved: 10, cost: 11.50, location: 'Main', bin: 'G1' },
  { code: 'A-CONDUIT-PVC-1', name: 'PVC Conduit 1 inch', category: 'Conduit', qty: 200, reserved: 25, cost: 6.25, location: 'Main', bin: 'G2' },
  { code: 'A-CONDUIT-PVC-2', name: 'PVC Conduit 2 inch', category: 'Conduit', qty: 150, reserved: 20, cost: 10.50, location: 'Main', bin: 'G2' },
  { code: 'A-CONNECTOR-MC-1/2', name: 'MC Cable Connector 1/2', category: 'Connectors', qty: 100, reserved: 10, cost: 1.85, location: 'Main', bin: 'H1' },
  { code: 'A-CONNECTOR-MC-3/4', name: 'MC Cable Connector 3/4', category: 'Connectors', qty: 85, reserved: 8, cost: 2.25, location: 'Main', bin: 'H1' },
  { code: 'A-DISCONNECT-30A', name: 'Disconnect 30A', category: 'Disconnects', qty: 18, reserved: 2, cost: 45.00, location: 'Main', bin: 'I1' },
  { code: 'A-DISCONNECT-60A', name: 'Disconnect 60A', category: 'Disconnects', qty: 22, reserved: 3, cost: 68.00, location: 'Main', bin: 'I1' },
  { code: 'A-DISCONNECT-100A', name: 'Disconnect 100A', category: 'Disconnects', qty: 15, reserved: 2, cost: 125.00, location: 'Main', bin: 'I1' },
  { code: 'A-FUSE-10A', name: 'Fuse 10A', category: 'Fuses', qty: 75, reserved: 5, cost: 3.50, location: 'Main', bin: 'J1' },
  { code: 'A-FUSE-15A', name: 'Fuse 15A', category: 'Fuses', qty: 90, reserved: 10, cost: 3.75, location: 'Main', bin: 'J1' },
  { code: 'A-FUSE-20A', name: 'Fuse 20A', category: 'Fuses', qty: 65, reserved: 8, cost: 4.00, location: 'Main', bin: 'J1' },
  { code: 'A-GROUND-ROD-8FT', name: 'Ground Rod 8 ft', category: 'Grounding', qty: 45, reserved: 5, cost: 18.50, location: 'Main', bin: 'K1' },
  { code: 'A-GROUND-CLAMP', name: 'Ground Clamp', category: 'Grounding', qty: 120, reserved: 15, cost: 4.25, location: 'Main', bin: 'K1' },
  { code: 'A-INVERTER-5KW', name: 'Inverter 5kW', category: 'Inverters', qty: 6, reserved: 1, cost: 1850.00, location: 'Main', bin: 'L1' },
  { code: 'A-INVERTER-7.6KW', name: 'Inverter 7.6kW', category: 'Inverters', qty: 8, reserved: 2, cost: 2450.00, location: 'Main', bin: 'L1' },
  { code: 'A-INVERTER-10KW', name: 'Inverter 10kW', category: 'Inverters', qty: 4, reserved: 1, cost: 3200.00, location: 'Main', bin: 'L1' },
  { code: 'A-JUNCTION-BOX-4X4', name: 'Junction Box 4x4', category: 'Boxes', qty: 150, reserved: 20, cost: 2.85, location: 'Main', bin: 'M1' },
  { code: 'A-JUNCTION-BOX-6X6', name: 'Junction Box 6x6', category: 'Boxes', qty: 100, reserved: 15, cost: 4.50, location: 'Main', bin: 'M1' },
  { code: 'A-METER-SOCKET', name: 'Meter Socket', category: 'Meters', qty: 12, reserved: 2, cost: 95.00, location: 'Main', bin: 'N1' },
  { code: 'A-MODULE-400W', name: 'Solar Module 400W', category: 'Modules', qty: 250, reserved: 40, cost: 185.00, location: 'Warehouse A', bin: 'SOLAR-1' },
  { code: 'A-MODULE-450W', name: 'Solar Module 450W', category: 'Modules', qty: 180, reserved: 30, cost: 210.00, location: 'Warehouse A', bin: 'SOLAR-1' },
  { code: 'A-MODULE-500W', name: 'Solar Module 500W', category: 'Modules', qty: 120, reserved: 20, cost: 245.00, location: 'Warehouse A', bin: 'SOLAR-2' },
  { code: 'A-OPTIMIZER', name: 'Power Optimizer', category: 'Optimizers', qty: 350, reserved: 50, cost: 68.00, location: 'Main', bin: 'O1' },
  { code: 'A-PANEL-100A', name: 'Electrical Panel 100A', category: 'Panels', qty: 8, reserved: 1, cost: 285.00, location: 'Main', bin: 'P1' },
  { code: 'A-PANEL-200A', name: 'Electrical Panel 200A', category: 'Panels', qty: 6, reserved: 1, cost: 425.00, location: 'Main', bin: 'P1' },
  { code: 'A-RAIL-165', name: 'Rail 165 inch', category: 'Racking', qty: 300, reserved: 40, cost: 42.00, location: 'Warehouse B', bin: 'RACK-1' },
  { code: 'A-RAIL-185', name: 'Rail 185 inch', category: 'Racking', qty: 250, reserved: 35, cost: 48.00, location: 'Warehouse B', bin: 'RACK-1' },
  { code: 'A-CLAMP-MID', name: 'Mid Clamp', category: 'Racking', qty: 800, reserved: 100, cost: 3.25, location: 'Warehouse B', bin: 'RACK-2' },
  { code: 'A-CLAMP-END', name: 'End Clamp', category: 'Racking', qty: 600, reserved: 80, cost: 3.75, location: 'Warehouse B', bin: 'RACK-2' },
  { code: 'A-SPLICE-KIT', name: 'Rail Splice Kit', category: 'Racking', qty: 120, reserved: 15, cost: 12.50, location: 'Warehouse B', bin: 'RACK-2' },
  { code: 'A-L-FOOT', name: 'L-Foot Attachment', category: 'Racking', qty: 200, reserved: 25, cost: 8.75, location: 'Warehouse B', bin: 'RACK-3' },
  { code: 'A-FLASHING-STD', name: 'Roof Flashing Standard', category: 'Racking', qty: 150, reserved: 20, cost: 15.50, location: 'Warehouse B', bin: 'RACK-3' },
  { code: 'A-WIRE-10AWG-BLK', name: 'Wire 10 AWG Black', category: 'Wire', qty: 5000, reserved: 500, cost: 0.85, location: 'Main', bin: 'W1' },
  { code: 'A-WIRE-10AWG-RED', name: 'Wire 10 AWG Red', category: 'Wire', qty: 5000, reserved: 500, cost: 0.85, location: 'Main', bin: 'W1' },
  { code: 'A-WIRE-10AWG-WHT', name: 'Wire 10 AWG White', category: 'Wire', qty: 4500, reserved: 450, cost: 0.85, location: 'Main', bin: 'W1' },
  { code: 'A-WIRE-10AWG-GRN', name: 'Wire 10 AWG Green', category: 'Wire', qty: 4000, reserved: 400, cost: 0.85, location: 'Main', bin: 'W1' },
  { code: 'A-WIRE-6AWG-BLK', name: 'Wire 6 AWG Black', category: 'Wire', qty: 3000, reserved: 300, cost: 1.45, location: 'Main', bin: 'W2' },
  { code: 'A-WIRE-6AWG-RED', name: 'Wire 6 AWG Red', category: 'Wire', qty: 3000, reserved: 300, cost: 1.45, location: 'Main', bin: 'W2' },
  { code: 'A-WIRE-4AWG-BLK', name: 'Wire 4 AWG Black', category: 'Wire', qty: 2000, reserved: 200, cost: 2.15, location: 'Main', bin: 'W3' },
  { code: 'A-WIRE-4AWG-RED', name: 'Wire 4 AWG Red', category: 'Wire', qty: 2000, reserved: 200, cost: 2.15, location: 'Main', bin: 'W3' },
  { code: 'A-WIRE-2AWG-BLK', name: 'Wire 2 AWG Black', category: 'Wire', qty: 1500, reserved: 150, cost: 3.25, location: 'Main', bin: 'W4' },
  { code: 'A-WIRE-2AWG-RED', name: 'Wire 2 AWG Red', category: 'Wire', qty: 1500, reserved: 150, cost: 3.25, location: 'Main', bin: 'W4' },
  { code: 'A-WIRE-NUT-RED', name: 'Wire Nut Red', category: 'Connectors', qty: 2000, reserved: 200, cost: 0.15, location: 'Main', bin: 'H2' },
  { code: 'A-WIRE-NUT-BLUE', name: 'Wire Nut Blue', category: 'Connectors', qty: 1500, reserved: 150, cost: 0.18, location: 'Main', bin: 'H2' },
  { code: 'A-WIRE-NUT-YELLOW', name: 'Wire Nut Yellow', category: 'Connectors', qty: 1800, reserved: 180, cost: 0.20, location: 'Main', bin: 'H2' },
  { code: 'A-TAPE-ELECT-BLK', name: 'Electrical Tape Black', category: 'Supplies', qty: 250, reserved: 25, cost: 2.50, location: 'Main', bin: 'S1' },
  { code: 'A-TAPE-ELECT-RED', name: 'Electrical Tape Red', category: 'Supplies', qty: 150, reserved: 15, cost: 2.50, location: 'Main', bin: 'S1' },
  { code: 'A-SILICONE-CLEAR', name: 'Silicone Sealant Clear', category: 'Supplies', qty: 80, reserved: 10, cost: 6.75, location: 'Main', bin: 'S2' },
  { code: 'A-SILICONE-BLACK', name: 'Silicone Sealant Black', category: 'Supplies', qty: 65, reserved: 8, cost: 6.75, location: 'Main', bin: 'S2' },
  { code: 'A-SCREWS-WOOD-2.5', name: 'Wood Screws 2.5 inch', category: 'Fasteners', qty: 5000, reserved: 500, cost: 0.08, location: 'Main', bin: 'F2' },
  { code: 'A-SCREWS-WOOD-3', name: 'Wood Screws 3 inch', category: 'Fasteners', qty: 4000, reserved: 400, cost: 0.10, location: 'Main', bin: 'F2' },
  { code: 'A-LAG-BOLT-3/8', name: 'Lag Bolt 3/8 inch', category: 'Fasteners', qty: 1000, reserved: 100, cost: 0.45, location: 'Main', bin: 'F3' },
  { code: 'A-LAG-BOLT-1/2', name: 'Lag Bolt 1/2 inch', category: 'Fasteners', qty: 800, reserved: 80, cost: 0.65, location: 'Main', bin: 'F3' },
  { code: 'A-WASHER-3/8', name: 'Washer 3/8 inch', category: 'Fasteners', qty: 2000, reserved: 200, cost: 0.08, location: 'Main', bin: 'F4' },
  { code: 'A-WASHER-1/2', name: 'Washer 1/2 inch', category: 'Fasteners', qty: 1800, reserved: 180, cost: 0.10, location: 'Main', bin: 'F4' },
  { code: 'A-COMBINER-BOX-3', name: 'Combiner Box 3 String', category: 'Boxes', qty: 15, reserved: 2, cost: 125.00, location: 'Main', bin: 'M2' },
  { code: 'A-COMBINER-BOX-6', name: 'Combiner Box 6 String', category: 'Boxes', qty: 12, reserved: 2, cost: 185.00, location: 'Main', bin: 'M2' },
  { code: 'A-MONITORING-GATEWAY', name: 'Monitoring Gateway', category: 'Monitoring', qty: 20, reserved: 3, cost: 285.00, location: 'Main', bin: 'T1' },
  { code: 'A-RAPID-SHUTDOWN', name: 'Rapid Shutdown Device', category: 'Safety', qty: 35, reserved: 5, cost: 95.00, location: 'Main', bin: 'B3' },
  { code: 'A-SAFETY-HARNESS', name: 'Safety Harness', category: 'Safety', qty: 12, reserved: 2, cost: 145.00, location: 'Main', bin: 'B1' },
  { code: 'A-HARD-HAT', name: 'Hard Hat', category: 'Safety', qty: 25, reserved: 0, cost: 18.50, location: 'Main', bin: 'B1' },
  { code: 'A-SAFETY-GLASSES', name: 'Safety Glasses', category: 'Safety', qty: 40, reserved: 0, cost: 8.75, location: 'Main', bin: 'B1' },
  { code: 'A-GLOVES-WORK', name: 'Work Gloves', category: 'Safety', qty: 60, reserved: 5, cost: 12.50, location: 'Main', bin: 'B1' },
  { code: 'A-LADDER-28FT', name: 'Extension Ladder 28 ft', category: 'Tools', qty: 4, reserved: 1, cost: 425.00, location: 'Tools', bin: 'TOOL-1' },
  { code: 'A-DRILL-IMPACT', name: 'Impact Drill Kit', category: 'Tools', qty: 8, reserved: 2, cost: 285.00, location: 'Tools', bin: 'TOOL-2' },
  { code: 'A-MULTIMETER', name: 'Digital Multimeter', category: 'Tools', qty: 15, reserved: 3, cost: 95.00, location: 'Tools', bin: 'TOOL-3' },
];

async function importInventory() {
  console.log('Starting warehouse inventory import...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const item of inventoryData) {
    const inventoryItem = {
      product_code: item.code,
      product_name: item.name,
      category: item.category,
      quantity_on_hand: item.qty,
      quantity_reserved: item.reserved,
      quantity_available: item.qty - item.reserved,
      unit_cost: item.cost,
      total_value: item.qty * item.cost,
      location: item.location,
      bin_location: item.bin,
      reorder_point: Math.floor(item.qty * 0.2),
      reorder_quantity: Math.floor(item.qty * 0.5),
      supplier_name: 'Primary Supplier',
      excel_source_file: '/Shared/Warehouse/Warehouse Pull Spreadsheet V28.xlsm',
      synced_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('warehouse_inventory')
        .upsert(inventoryItem, {
          onConflict: 'product_code',
          ignoreDuplicates: false
        });

      if (error) throw error;

      successCount++;
      console.log(`✓ Imported: ${item.code} - ${item.name}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Error importing ${item.code}:`, error.message);
    }
  }

  console.log(`\n========================================`);
  console.log(`Import Complete!`);
  console.log(`✓ Successfully imported: ${successCount} items`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log(`========================================\n`);

  const { data: summary, error } = await supabase
    .from('warehouse_inventory')
    .select('category, quantity_on_hand.sum(), total_value.sum()')
    .group('category');

  if (!error && summary) {
    console.log('\nInventory Summary by Category:');
    console.log('========================================');
    const { data: categories } = await supabase
      .from('warehouse_inventory')
      .select('category, quantity_on_hand, total_value');

    if (categories) {
      const categoryTotals = {};
      categories.forEach(item => {
        if (!categoryTotals[item.category]) {
          categoryTotals[item.category] = { qty: 0, value: 0 };
        }
        categoryTotals[item.category].qty += item.quantity_on_hand;
        categoryTotals[item.category].value += parseFloat(item.total_value);
      });

      Object.entries(categoryTotals).forEach(([cat, totals]) => {
        console.log(`${cat}: ${totals.qty} items, $${totals.value.toFixed(2)}`);
      });
    }
  }
}

importInventory();
