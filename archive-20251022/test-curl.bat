@echo off
echo Testing upload endpoint with curl...

curl -X POST ^
  "http://localhost:5001/api/group-chats/68e764a59d20929e97a0687e/upload-images" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NjAyNDU5NzB9.kOsPI0MWCN8KO4GGrywy5YV6UVP-zBKcpJSYkCCYFG0" ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"Test message\"}" ^
  -i -s