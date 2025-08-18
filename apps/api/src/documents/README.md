# Documents Module

Handles file uploads and management.

## Endpoints

- `POST /documents/upload/appointment/:appointmentId`
  - **Description**: Uploads a document for a specific appointment.
  - **Roles**: `VET`
  - **Body**: `multipart/form-data` with a `file` field and an optional `description` field.
  - **Response**: `Document`
