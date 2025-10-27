@echo off
cls
echo ========================================
echo   Lost ^& Found System
echo   หยุดการทำงานของระบบ
echo ========================================
echo.

docker-compose -f docker-compose.production.yml down

if %errorlevel% equ 0 (
    echo.
    echo ✅ หยุดระบบเรียบร้อยแล้ว
    echo.
) else (
    echo.
    echo ⚠️  มีข้อผิดพลาด
    echo.
)

pause

