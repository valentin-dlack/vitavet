# Admin Module

Handles administration tasks.

## Endpoints

- `GET /admin/users`
  - **Description**: Lists all users in the system.
  - **Roles**: `SUPER_ADMIN`
  - **Response**: `AdminUserDto[]`

- `GET /admin/clinics`
  - **Description**: Lists all clinics in the system.
  - **Roles**: `SUPER_ADMIN`
  - **Response**: `AdminClinicDto[]`
