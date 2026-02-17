/**
 * Lark CFG grammar for valid ClickHouse SQL queries against the `orders` table.
 *
 * This grammar is sent to GPT-5 as a custom tool format constraint,
 * guaranteeing that the model's output is syntactically valid SQL.
 *
 * Schema: order_id, customer_id, customer_name, product_name, category,
 *         quantity, unit_price, amount, order_date
 */
export const LARK_GRAMMAR = `
start: select_stmt

SP: " "
COMMA: ","

select_stmt: "SELECT" SP select_list SP "FROM" SP "orders" (SP where_clause)? (SP group_by_clause)? (SP having_clause)? (SP order_by_clause)? (SP limit_clause)?

// SELECT list
select_list: select_item (COMMA SP select_item)*
select_item: "*" | expr (SP alias)?
alias: "AS" SP CNAME

// Table columns (pinned to orders schema)
column: "order_id" | "customer_id" | "customer_name" | "product_name" | "category" | "quantity" | "unit_price" | "amount" | "order_date"

// Aggregate functions
aggregate: AGG_FUNC "(" agg_arg ")" | AGG_FUNC "(" "DISTINCT" SP agg_arg ")"
AGG_FUNC: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX"
agg_arg: "*" | expr

// Expressions (precedence climbing — no left recursion)
expr: add_expr
add_expr: mul_expr (SP ADD_OP SP mul_expr)*
ADD_OP: "+" | "-"
mul_expr: unary (SP MUL_OP SP unary)*
MUL_OP: "*" | "/"
unary: "-" atom | atom
atom: column | literal | aggregate | date_func | interval_lit | "(" expr ")"

// Date/time functions and intervals
date_func: "now()" | "today()" | "toDate(" expr ")" | "toDateTime(" expr ")"
interval_lit: "INTERVAL" SP NUMBER SP INTERVAL_UNIT
INTERVAL_UNIT: "DAY" | "WEEK" | "MONTH" | "YEAR" | "HOUR" | "MINUTE" | "SECOND"

// WHERE clause
where_clause: "WHERE" SP condition
condition: predicate (SP LOGIC_OP SP predicate)*
LOGIC_OP: "AND" | "OR"
predicate: comparison | between_pred | in_pred | null_pred | like_pred | "(" condition ")"
comparison: expr SP COMP_OP SP expr
COMP_OP: "=" | "!=" | "<" | ">" | "<=" | ">="
between_pred: expr SP "BETWEEN" SP expr SP "AND" SP expr | expr SP "NOT" SP "BETWEEN" SP expr SP "AND" SP expr
in_pred: expr SP "IN" SP "(" value_list ")" | expr SP "NOT" SP "IN" SP "(" value_list ")"
null_pred: expr SP "IS" SP "NULL" | expr SP "IS" SP "NOT" SP "NULL"
like_pred: expr SP "LIKE" SP STRING | expr SP "NOT" SP "LIKE" SP STRING

// GROUP BY / HAVING
group_by_clause: "GROUP" SP "BY" SP group_list
group_list: group_item (COMMA SP group_item)*
group_item: column | NUMBER
having_clause: "HAVING" SP condition

// ORDER BY / LIMIT
order_by_clause: "ORDER" SP "BY" SP order_list
order_list: order_item (COMMA SP order_item)*
order_item: order_key (SP sort_dir)?
order_key: column | aggregate | CNAME | NUMBER
sort_dir: "ASC" | "DESC"
limit_clause: "LIMIT" SP NUMBER

// Literals (bounded terminals per cookbook guidelines)
value_list: literal (COMMA SP literal)*
literal: NUMBER | STRING | "NULL"
NUMBER: /[0-9]{1,15}(\\.[0-9]{1,6})?/
STRING: /'[^'\\n]{0,100}'/
CNAME: /[a-z_][a-z0-9_]{0,30}/
`;
