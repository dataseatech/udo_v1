# Great Expectations setup

This directory contains a minimal Great Expectations configuration for validating the `orders` table in Postgres.

Components:
- great_expectations/great_expectations.yml : core config
- expectations/orders_suite.json : expectation suite
- checkpoints/orders_checkpoint.yml : checkpoint referencing public.orders

Run manually (inside any container with GE + psycopg2 installed):
```
python -c "import great_expectations as ge; c=ge.get_context(context_root_dir='great_expectations'); r=c.run_checkpoint(checkpoint_name='orders_checkpoint'); print(r.success)"
```
