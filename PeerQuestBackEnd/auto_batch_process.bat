@echo off
REM Automated Batch Processing Script for PeerQuest (Windows)
REM This script can be run via Windows Task Scheduler to automatically process batches

REM Change to the backend directory
cd /d "C:\Users\Mark\Desktop\PeerQuestWebsite\PeerQuestBackEnd"

REM Activate virtual environment if using one
REM call venv\Scripts\activate

REM Set Django settings module
set DJANGO_SETTINGS_MODULE=core.settings

REM Process current batch and start manual review
echo %DATE% %TIME%: Starting automated batch processing...

REM Start batch processing (marks payments as ready for manual review)
python manage_batch_payments.py process

echo %DATE% %TIME%: Batch processing started - manual verification required.

REM Optional: Send email notification to admins about manual review needed
REM python manage.py send_batch_notification

pause
