import logging

logger = logging.getLogger(__name__)

def send_sms_notification(to_number, message):
    # Replace with actual SMS provider (Twilio, Africa's Talking, etc.)
    logger.info(f"SMS to {to_number}: {message}")
    # Example with console (for development)
    print(f"SMS sent to {to_number}: {message}")