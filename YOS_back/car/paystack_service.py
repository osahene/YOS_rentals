import requests
from django.conf import settings
import json


class PaystackService:
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.base_url = 'https://api.paystack.co'
        self.headers = {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json'
        }

    def initialize_transaction(self, email, amount, reference, metadata=None):
        """Initialize a Paystack transaction"""
        url = f'{self.base_url}/transaction/initialize'

        data = {
            'email': email,
            'amount': int(amount * 100),  # Convert to kobo/pesewas
            'reference': reference,
            'currency': 'GHS',
            'metadata': metadata or {}
        }

        response = requests.post(url, headers=self.headers, json=data)
        return response.json()

    def verify_transaction(self, reference):
        """Verify a Paystack transaction"""
        url = f'{self.base_url}/transaction/verify/{reference}'

        response = requests.get(url, headers=self.headers)
        return response.json()

    def create_transfer_recipient(self, name, account_number, bank_code, currency='GHS'):
        """Create a transfer recipient"""
        url = f'{self.base_url}/transferrecipient'

        data = {
            'type': 'mobile_money',
            'name': name,
            'account_number': account_number,
            'bank_code': bank_code,
            'currency': currency
        }

        response = requests.post(url, headers=self.headers, json=data)
        return response.json()

    def initiate_transfer(self, recipient_code, amount, reason):
        """Initiate a transfer to a recipient"""
        url = f'{self.base_url}/transfer'

        data = {
            'source': 'balance',
            'amount': int(amount * 100),
            'recipient': recipient_code,
            'reason': reason
        }

        response = requests.post(url, headers=self.headers, json=data)
        return response.json()

    def check_transfer_status(self, transfer_code):
        """Check the status of a transfer"""
        url = f'{self.base_url}/transfer/{transfer_code}'

        response = requests.get(url, headers=self.headers)
        return response.json()

    def list_banks(self, country='Ghana'):
        """List all banks for a country"""
        url = f'{self.base_url}/bank'
        params = {'country': country}

        response = requests.get(url, headers=self.headers, params=params)
        return response.json()
