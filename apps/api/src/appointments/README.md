# Appointments Module

## Description
This module handles the creation, confirmation, and completion of appointments.

## Endpoints

### `PATCH /appointments/:id/complete`

Marks an appointment as completed and saves consultation notes and a report. This action can only be performed by the veterinarian assigned to the appointment.

**URL Parameters:**
- `id` (string, required): The ID of the appointment to complete.

**Request Body:**
```json
{
  "notes": "Internal notes for the vet's reference.",
  "report": "Consultation report visible to the animal's owner."
}
```
- `notes` (string, optional): Internal notes, visible only to clinic staff.
- `report` (string, optional): A summary of the consultation, which will be shared with the pet owner.

**Responses:**
- `200 OK`: If the appointment is successfully completed.
  ```json
  {
    "id": "...",
    "status": "COMPLETED",
    "notes": "Internal notes for the vet's reference.",
    "report": "Consultation report visible to the animal's owner.",
    "message": "Appointment completed and report saved."
  }
  ```
- `403 Forbidden`: If the user is not the veterinarian assigned to the appointment.
- `404 Not Found`: If the appointment with the specified ID does not exist.
- `409 Conflict`: If the appointment has already been completed.

- `GET /appointments/:id/documents`
  - **Description**: Retrieves all documents for a specific appointment.
  - **Roles**: `VET`, `OWNER`
  - **Response**: `Document[]`
