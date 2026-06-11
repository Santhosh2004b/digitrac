import sqlalchemy
from app.db.session import engine
from sqlalchemy import text

cols=['customer_name', 'customer_payment_terms', 'vendor_payment_terms', 'po_reference', 'amendment_details', 'total_cost_price', 'total_sell_price', 'gst', 'total_sell_price_with_gst', 'pmc_cost', 'margin_amount', 'sale_value', 'capex', 'opex', 'it_cost', 'non_it_cost', 'implementation_cost', 'travel_cost', 'accommodation_cost', 'insurance_cost', 'risk_cost', 'misc_cost', 'freight', 'total_cost_baseline', 'margin_pct_baseline', 'net_margin_baseline', 'duration_months', 'margin_target_pct', 'margin_deviation_pct', 'total_hours_used', 'expected_hours', 'efficiency_score', 'performance_score', 'optimized_hours', 'total_expected_hours', 'revenue_value', 'priority']
float_cols = ['total_cost_price', 'total_sell_price', 'gst', 'total_sell_price_with_gst', 'pmc_cost', 'margin_amount', 'sale_value', 'capex', 'opex', 'it_cost', 'non_it_cost', 'implementation_cost', 'travel_cost', 'accommodation_cost', 'insurance_cost', 'risk_cost', 'misc_cost', 'freight', 'total_cost_baseline', 'margin_pct_baseline', 'net_margin_baseline', 'duration_months', 'margin_target_pct', 'margin_deviation_pct', 'total_hours_used', 'expected_hours', 'efficiency_score', 'performance_score', 'optimized_hours', 'total_expected_hours', 'revenue_value']

with engine.connect() as conn:
    for c in cols:
        col_type = 'FLOAT' if c in float_cols else 'VARCHAR'
        try:
            conn.execute(text(f'ALTER TABLE projects ADD COLUMN {c} {col_type};'))
            conn.commit()
            print(f"Added column {c}")
        except Exception as e:
            conn.rollback()

print('Migrations applied')
