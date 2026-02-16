/**
 * Lark CFG grammar for valid ClickHouse SQL queries.
 *
 * This grammar is sent to GPT-5 as a custom tool format constraint,
 * guaranteeing that the model's output is syntactically valid SQL
 * for the ingested e-commerce table.
 *
 * TODO: Update column names and table name after data ingestion (Feature 1).
 */
export const LARK_GRAMMAR = `
start: select_stmt

select_stmt: "SELECT" select_list "FROM" table_name (where_clause)? (group_by_clause)? (order_by_clause)? (limit_clause)?

select_list: select_item ("," select_item)*
select_item: aggregate_expr (alias)? | column_ref (alias)?  | star
star: "*"
alias: "AS" IDENTIFIER

// Columns — update these after ingesting the dataset
column_ref: IDENTIFIER
table_name: IDENTIFIER

// Aggregates
aggregate_expr: agg_func "(" (DISTINCT)? (column_ref | star | expr) ")"
agg_func: "SUM" | "COUNT" | "AVG" | "MIN" | "MAX"
DISTINCT: "DISTINCT"

// WHERE clause
where_clause: "WHERE" condition
condition: comparison (logic_op condition)?
comparison: expr comp_op expr | expr "BETWEEN" expr "AND" expr | expr "IN" "(" value_list ")" | expr "IS" "NOT"? "NULL" | expr "LIKE" STRING
logic_op: "AND" | "OR"
comp_op: "=" | "!=" | "<" | ">" | "<=" | ">="

// Expressions
expr: column_ref | literal | aggregate_expr | date_expr | arithmetic_expr | "(" expr ")"
arithmetic_expr: expr arith_op expr
arith_op: "+" | "-" | "*" | "/"
date_expr: "now()" | "today()" | date_interval | "toDate(" expr ")" | "toDateTime(" expr ")"
date_interval: "INTERVAL" NUMBER interval_unit
interval_unit: "DAY" | "HOUR" | "MINUTE" | "SECOND" | "WEEK" | "MONTH" | "YEAR"

// GROUP BY, ORDER BY, LIMIT
group_by_clause: "GROUP BY" column_list
order_by_clause: "ORDER BY" order_list
order_list: order_item ("," order_item)*
order_item: (column_ref | aggregate_expr | NUMBER) sort_dir?
sort_dir: "ASC" | "DESC"
limit_clause: "LIMIT" NUMBER

column_list: column_ref ("," column_ref)*

// Values
value_list: literal ("," literal)*
literal: NUMBER | STRING | "NULL"
NUMBER: /[0-9]+(\\.[0-9]+)?/
STRING: "'" /[^']*/ "'"
IDENTIFIER: /[a-zA-Z_][a-zA-Z0-9_]*/

%ignore /\\s+/
`;
