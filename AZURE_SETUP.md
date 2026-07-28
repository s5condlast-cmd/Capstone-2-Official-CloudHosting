# Azure App Registration & Tenant Setup Guide

Microsoft restricts personal accounts from creating Azure Tenants or registering applications to prevent bot abuse. To unlock these features, you must attach an active Azure Subscription to your personal account. 

Follow **Option A** (if you have a university email) or **Option B** (if you have a GCash/Mastercard) to unlock your account.

---

## Option A: Azure for Students (No Credit Card Required)
*Use this option if you have an active school/university email address (e.g., `@edu.ph`).*

1. **Go to the portal**: Visit the [Azure for Students](https://azure.microsoft.com/en-us/free/students/) page.
2. **Start Free**: Click the big **Start free** button.
3. **Sign In**: Log in using your **personal** Microsoft account (the one you are currently using for Azure).
4. **Verify Academic Status**: Microsoft will prompt you to prove you are a student. Enter your **school/university email address**.
5. **Check Email**: Open your school email inbox and look for an email from Microsoft containing a verification link or code.
6. **Activate**: Click the link or enter the code. 
> **Note:** Your personal account is now upgraded! You get $100 in free credits and you did not have to enter a credit card.

---

## Option B: Azure Free Trial (Requires GCash / Debit Card)
*Use this option if you do not have a university email. You will not be charged.*

1. **Go to Azure Subscriptions**: Log into the [Azure Portal](https://portal.azure.com/).
2. **Find Subscriptions**: In the top search bar, search for **Subscriptions** and click it.
3. **Add Subscription**: Click **+ Add** (or Add a different subscription).
4. **Select Free Trial**: Choose the **Free Trial** (or Pay-As-You-Go) offer.
5. **Verify Identity**: Enter your GCash Mastercard or bank card details. 
> **Important:** Microsoft will perform a small temporary hold (~50 PHP) to prove the card is real, but it is **instantly reversed**. You will not be charged, and you receive $200 in free credits for 30 days.

---

## Final Step: Create Your Tenant & App

Once you have completed either Option A or Option B, your account is verified and unlocked! Now you can create your tenant and get your Client ID for our OneDrive integration.

### 1. Create the Tenant
1. Go back to the [Azure Portal](https://portal.azure.com/).
2. Search for **Microsoft Entra ID** (formerly Azure Active Directory).
3. In the top menu, click **Manage tenants**.
4. Click the **+ Create** button (it will now be blue and clickable!).
5. Choose **Microsoft Entra ID**, fill in an Organization Name and Initial Domain Name (these can be anything), and click **Create**.
6. Once created, click your profile picture in the top right corner, select **Switch Directory**, and switch to your new tenant.

### 2. Register the App
1. Inside your new tenant, go to **Microsoft Entra ID**.
2. On the left sidebar, click **App registrations**, then click **+ New registration**.
3. **Name**: Enter a name for your app (e.g., "OJT Cloud Hosting").
4. **Supported account types**: Choose **Accounts in any organizational directory and personal Microsoft accounts** (this allows students with standard `@outlook.com` emails to use your app).
5. **Redirect URI**: Select **Single-page application (SPA)** from the dropdown and enter `http://localhost:3000`.
6. Click **Register**.

### 3. Get Your Keys
After clicking Register, you will be taken to your app's Overview page. 
- Copy the **Application (client) ID**.
- Send that ID to me in the chat, and we will begin writing the code for the OneDrive integration!
