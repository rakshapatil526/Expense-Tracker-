from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import User


class UserAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.profile_url = reverse('user-profile')

    def test_registration_and_login_flow(self):
        # 1. Register
        reg_data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'password123',
            'confirm_password': 'password123'
        }
        res = self.client.post(self.register_url, reg_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', res.data)
        self.assertIn('access', res.data['tokens'])

        # 2. Login
        login_data = {
            'email': 'test@example.com',
            'password': 'password123'
        }
        login_res = self.client.post(self.login_url, login_data)
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data['tokens']['access']

        # 3. Authenticated profile check
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        profile_res = self.client.get(self.profile_url)
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data['email'], 'test@example.com')
