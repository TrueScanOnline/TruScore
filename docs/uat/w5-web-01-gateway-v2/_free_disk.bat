@echo off
rmdir /s /q "C:\TrueScan-FoodScanner-w5-web-teaser-v2\android\app\build"
rmdir /s /q "C:\TrueScan-FoodScanner-w5-web-teaser-v2\android\build"
rmdir /s /q "C:\TrueScan-FoodScanner-w5-web-teaser-v2\android\.gradle"
del /q "C:\TrueScan-FoodScanner-w5-web-teaser-v2\android\hs_err_pid*.log" 2>nul
fsutil volume diskfree c:
