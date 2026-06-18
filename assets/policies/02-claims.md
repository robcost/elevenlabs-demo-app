# Meridian Member Services — Claims Process & Status

> Fictional demo content for the "Meridian" scenario. Knowledge-base document 2 of 4.

## How to lodge a claim

A member can lodge a claim by phone with Meridian, or online via the member portal. To start a claim, Meridian needs the member's **member ID**, the **type of cover** being claimed against, and a brief description of what happened. Identity must be verified first.

## Documents typically required

- **Life Protect / Final Expenses:** certified death or terminal-illness certificate, and proof of the beneficiary's identity.
- **Income Assist:** a treating-doctor's medical report and recent proof of income.
- **Pet Care:** an itemised vet invoice and the pet's clinical history.

Claims cannot be fully assessed until **all required documents** have been received.

## Claim statuses

Every claim moves through a defined set of statuses. When a member asks about a claim, read back the current status and the next step:

| Status | Meaning |
| :--- | :--- |
| **Received** | The claim has been logged and acknowledged. |
| **Under Assessment** | An assessor is reviewing the claim and documents. |
| **Information Requested** | Meridian needs more documents or details before it can proceed. |
| **Approved** | The claim has been accepted; payment is being arranged. |
| **Paid** | The benefit has been paid to the nominated account. |
| **Declined** | The claim was not accepted; a written explanation and review options are provided. |

## Timeframes

- Meridian **acknowledges** a new claim within **2 business days**.
- A decision is made within **10 business days** of receiving **all** required documents.
- Approved benefits are **paid within 5 business days** of approval.

If a claim is in **Information Requested**, the timeframe pauses until the outstanding items are received.

## Using the claim-status tool

When a member asks about an existing claim and their identity is verified, use **check_claim_status(member_id)** to retrieve the current status. Explain the status in plain language and tell the member the single next thing that will happen or that they need to do.

## Declined claims and reviews

A member who disagrees with a declined claim can request an **internal review**. If they remain unsatisfied, they can escalate to the **Australian Financial Complaints Authority (AFCA)** — see the Contact & Complaints document. Declined-claim conversations should be handled with care and, where the member is upset, offered a transfer to a specialist.
