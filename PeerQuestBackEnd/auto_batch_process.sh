#!/bin/bash
# Automated Batch Processing Script for PeerQuest
# This script can be run via cron job to automatically process batches

# Change to the backend directory
cd /path/to/PeerQuestBackEnd

# Activate virtual environment if using one
# source venv/bin/activate

# Set Django settings module
export DJANGO_SETTINGS_MODULE=core.settings

# Process current batch and start manual review
echo "$(date): Starting automated batch processing..."

# Start batch processing (marks payments as ready for manual review)
python manage_batch_payments.py process

echo "$(date): Batch processing started - manual verification required."

# Optional: Send email notification to admins about manual review needed
# python manage.py send_batch_notification
