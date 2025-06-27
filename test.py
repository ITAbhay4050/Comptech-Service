import pyodbc

conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=192.168.1.5\\MSSQLSERVER1;"   # 👈 use named instance
    "DATABASE=Test;"
    "UID=sa;"
    "PWD=nipl@12345;"
    "TrustServerCertificate=yes;"
)

try:
    conn = pyodbc.connect(conn_str, timeout=5)
    print("✅ Connection successful")
except Exception as e:
    print("❌ Connection failed:", e)
