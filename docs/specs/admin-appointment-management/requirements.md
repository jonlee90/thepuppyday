# Requirements Document

## Introduction

This specification defines requirements for two complementary features in The Puppy Day admin panel that enhance appointment management capabilities: Manual Appointment Creation and CSV Import.

Currently, appointments are created exclusively through the customer-facing booking widget. However, the business needs the ability to create appointments through alternative channels (phone bookings, walk-ins, emergency slots) and migrate historical appointment data from previous systems.

The Manual Appointment Creation feature enables admin users to create single appointments directly through the admin panel with the same data validation and business rules as the customer booking flow. The CSV Import feature allows bulk appointment creation by uploading structured data files, facilitating data migration and batch operations.

Both features integrate seamlessly with the existing appointment workflow, maintaining data integrity, enforcing size-based pricing rules, and providing clear feedback on operation success or failure.

## Requirements

### Requirement 1: Manual Appointment Form Access

**User Story:** As an admin user, I want to access a manual appointment creation form from the appointments page, so that I can create appointments for customers who book via phone or walk-in.

#### Acceptance Criteria

1. WHEN the admin navigates to /admin/appointments THEN the system SHALL display a "Create Appointment" button prominently on the page
2. WHEN the admin clicks the "Create Appointment" button THEN the system SHALL display a modal or form interface for manual appointment creation
3. IF the user is not authenticated as an admin THEN the system SHALL NOT display the "Create Appointment" button
4. WHEN the appointment creation form is displayed THEN the system SHALL provide a clear way to cancel or close the form without saving

### Requirement 2: Customer Selection

**User Story:** As an admin user, I want to search for and select an existing customer when creating an appointment, so that the appointment is properly associated with their account.

#### Acceptance Criteria

1. WHEN the admin opens the appointment creation form THEN the system SHALL display a searchable customer selection field
2. WHEN the admin types in the customer search field THEN the system SHALL filter customers by name, email, or phone number in real-time
3. WHEN the admin selects a customer THEN the system SHALL populate the form with the customer's associated pets
4. IF no customers match the search criteria THEN the system SHALL display a message "No customers found" and provide an option to create a new customer
5. WHEN the admin chooses to create a new customer THEN the system SHALL display fields for: name, email, phone number
6. WHEN creating a new customer THEN the system SHALL validate that the email format is valid
7. WHEN creating a new customer THEN the system SHALL validate that the phone number is in a valid format
8. IF a customer with the same email already exists THEN the system SHALL display an error "Customer with this email already exists"

### Requirement 3: Pet Selection and Creation

**User Story:** As an admin user, I want to select an existing pet or create a new pet for the appointment, so that I can properly record which pet is being serviced.

#### Acceptance Criteria

1. WHEN a customer is selected THEN the system SHALL display all pets associated with that customer in a selectable list
2. WHEN the admin selects an existing pet THEN the system SHALL auto-populate service recommendations based on the pet's size
3. IF the selected customer has no pets THEN the system SHALL display a message "No pets found for this customer" and require pet creation
4. WHEN the admin chooses to create a new pet THEN the system SHALL display fields for: pet name, breed, size (Small/Medium/Large/X-Large), weight
5. WHEN creating a new pet THEN the system SHALL validate that pet name is not empty
6. WHEN creating a new pet THEN the system SHALL validate that size is one of: Small, Medium, Large, X-Large
7. WHEN creating a new pet AND weight is provided THEN the system SHALL validate that the weight matches the selected size range (Small: 0-18 lbs, Medium: 19-35 lbs, Large: 36-65 lbs, X-Large: 66+ lbs)
8. IF the weight does not match the size range THEN the system SHALL display a warning "Weight does not match size range" and allow the admin to confirm or adjust

### Requirement 4: Service Selection

**User Story:** As an admin user, I want to select services for the appointment with accurate pricing, so that the customer is charged correctly.

#### Acceptance Criteria

1. WHEN a pet is selected THEN the system SHALL display available services: Basic Grooming, Premium Grooming, Day Care
2. WHEN the admin selects a service THEN the system SHALL display the price based on the pet's size
3. WHEN the admin selects a service THEN the system SHALL use the current pricing from the service_prices table
4. IF no pricing exists for the selected service and size combination THEN the system SHALL display an error "Pricing not configured for this service and size"
5. WHEN displaying service prices THEN the system SHALL format prices in USD currency format (e.g., $40.00)
6. WHEN a service is selected THEN the system SHALL enable the addon selection options

### Requirement 5: Addon Selection

**User Story:** As an admin user, I want to add optional services to the appointment, so that I can accommodate customer requests for extras.

#### Acceptance Criteria

1. WHEN a primary service is selected THEN the system SHALL display available addons: Long Hair/Sporting, Teeth Brushing, Pawdicure, Flea & Tick Treatment, Tangle Removal
2. WHEN the admin selects an addon THEN the system SHALL add the addon price to the total appointment cost
3. WHEN the admin deselects an addon THEN the system SHALL remove the addon price from the total appointment cost
4. WHEN displaying addon prices THEN the system SHALL show the current price from the addons table
5. WHEN multiple addons are selected THEN the system SHALL calculate the cumulative total correctly
6. WHEN the admin views the form THEN the system SHALL display a running total that updates in real-time as services and addons are selected

### Requirement 6: Date and Time Selection

**User Story:** As an admin user, I want to select a date and time for the appointment, so that I can schedule the customer at an available slot.

#### Acceptance Criteria

1. WHEN the admin accesses the date selection THEN the system SHALL display a calendar interface showing available dates
2. WHEN the admin selects a date THEN the system SHALL display available time slots for that date based on business hours (Monday-Saturday, 9:00 AM - 5:00 PM)
3. WHEN the admin selects a date that is Sunday THEN the system SHALL display a message "The business is closed on Sundays"
4. WHEN the admin selects a date THEN the system SHALL check existing appointments and display only available time slots
5. IF a time slot is fully booked THEN the system SHALL mark it as unavailable and not allow selection
6. WHEN the admin selects a time slot THEN the system SHALL highlight the selection and include it in the appointment summary
7. IF the selected date is in the past THEN the system SHALL display a warning "This date is in the past" and require admin confirmation to proceed
8. WHEN business hours are closed or modified in settings THEN the system SHALL reflect the updated hours in available time slots

### Requirement 7: Appointment Notes

**User Story:** As an admin user, I want to add notes to the appointment, so that I can record special instructions or customer requests.

#### Acceptance Criteria

1. WHEN the admin views the appointment creation form THEN the system SHALL display a notes text area field
2. WHEN the admin enters notes THEN the system SHALL allow up to 1000 characters
3. WHEN the admin exceeds 1000 characters THEN the system SHALL display a character count indicator and prevent additional input
4. WHEN notes are entered THEN the system SHALL preserve line breaks and formatting
5. WHEN the appointment is saved THEN the system SHALL store the notes in the appointments table

### Requirement 8: Appointment Summary and Confirmation

**User Story:** As an admin user, I want to review all appointment details before saving, so that I can verify accuracy before committing the data.

#### Acceptance Criteria

1. WHEN all required fields are completed THEN the system SHALL display a summary section showing: customer name, pet name, service, addons, date, time, total price, notes
2. WHEN the admin reviews the summary THEN the system SHALL provide a "Create Appointment" button to confirm
3. WHEN the admin clicks "Create Appointment" THEN the system SHALL validate all fields before submission
4. IF any required fields are missing THEN the system SHALL display field-specific error messages and prevent submission
5. IF any validation rules are violated THEN the system SHALL display error messages and highlight the problematic fields
6. WHEN validation passes and the appointment is created THEN the system SHALL save the appointment to the database
7. WHEN the appointment is successfully created THEN the system SHALL display a success message "Appointment created successfully for [Customer Name] on [Date] at [Time]"
8. WHEN the appointment is successfully created THEN the system SHALL close the form and refresh the appointments list to show the new appointment
9. IF the database save fails THEN the system SHALL display an error message "Failed to create appointment. Please try again."

### Requirement 9: Payment Status Selection

**User Story:** As an admin user, I want to set the payment status when creating an appointment, so that I can record whether the customer has paid, will pay later, or paid via external means.

#### Acceptance Criteria

1. WHEN the admin views the appointment creation form THEN the system SHALL display a payment status field with options: Pending, Paid, Partially Paid
2. WHEN the admin selects "Paid" THEN the system SHALL optionally display a payment method field with options: Cash, Card, Other
3. WHEN the admin selects "Partially Paid" THEN the system SHALL display a field to enter the amount paid
4. WHEN the admin enters a partial payment amount THEN the system SHALL validate that it is greater than $0 and less than the total appointment cost
5. IF the partial payment amount is invalid THEN the system SHALL display an error "Partial payment must be between $0 and total cost"
6. WHEN the appointment is created with "Paid" status THEN the system SHALL record the payment in the payments table
7. WHEN the appointment defaults to creation THEN the payment status SHALL default to "Pending"

### Requirement 10: CSV Import Access

**User Story:** As an admin user, I want to access a CSV import feature from the appointments page, so that I can bulk import historical appointments or batch create appointments.

#### Acceptance Criteria

1. WHEN the admin navigates to /admin/appointments THEN the system SHALL display an "Import CSV" button
2. WHEN the admin clicks "Import CSV" THEN the system SHALL display a modal with file upload interface
3. IF the user is not authenticated as an admin THEN the system SHALL NOT display the "Import CSV" button
4. WHEN the import modal is displayed THEN the system SHALL provide a link to download a CSV template file
5. WHEN the admin downloads the template THEN the system SHALL provide a properly formatted CSV file with column headers and example data

### Requirement 11: CSV File Validation

**User Story:** As an admin user, I want the system to validate my CSV file before processing, so that I receive clear feedback on file format errors.

#### Acceptance Criteria

1. WHEN the admin selects a file for upload THEN the system SHALL validate that the file extension is .csv
2. IF the file extension is not .csv THEN the system SHALL display an error "Please upload a CSV file" and prevent upload
3. WHEN the admin uploads a file THEN the system SHALL validate that the file size is less than 5MB
4. IF the file size exceeds 5MB THEN the system SHALL display an error "File size must be less than 5MB"
5. WHEN the system receives a CSV file THEN the system SHALL validate that it contains the required column headers
6. IF required column headers are missing THEN the system SHALL display an error "CSV is missing required columns: [column names]" and prevent processing
7. WHEN the CSV file passes initial validation THEN the system SHALL display a preview of the first 5 rows for admin review
8. WHEN the preview is displayed THEN the system SHALL show a "Continue Import" button to proceed with processing

### Requirement 12: CSV Column Requirements

**User Story:** As an admin user, I want to understand the required CSV format, so that I can prepare my data correctly for import.

#### Acceptance Criteria

1. WHEN documenting CSV requirements THEN the system SHALL require the following columns: customer_email, customer_name, customer_phone, pet_name, pet_breed, pet_size, pet_weight, service_name, appointment_date, appointment_time
2. WHEN documenting CSV requirements THEN the system SHALL support the following optional columns: addons (comma-separated), notes, payment_status, payment_method, amount_paid
3. WHEN processing pet_size values THEN the system SHALL accept only: Small, Medium, Large, X-Large (case-insensitive)
4. WHEN processing service_name values THEN the system SHALL accept only: Basic Grooming, Premium Grooming, Day Care (case-insensitive)
5. WHEN processing appointment_date values THEN the system SHALL accept format: YYYY-MM-DD or MM/DD/YYYY
6. WHEN processing appointment_time values THEN the system SHALL accept format: HH:MM AM/PM or HH:MM (24-hour)
7. WHEN processing payment_status values THEN the system SHALL accept: Pending, Paid, Partially Paid (case-insensitive)
8. WHEN processing addons values THEN the system SHALL accept comma-separated addon names matching the addons table

### Requirement 13: CSV Row Validation

**User Story:** As an admin user, I want each CSV row to be validated individually, so that I know which specific rows have errors and can fix them.

#### Acceptance Criteria

1. WHEN the system processes each CSV row THEN the system SHALL validate that customer_email is in valid email format
2. WHEN the system processes each CSV row THEN the system SHALL validate that customer_phone is in a valid phone number format
3. WHEN the system processes each CSV row THEN the system SHALL validate that pet_size matches the pet_weight range
4. WHEN the system processes each CSV row THEN the system SHALL validate that service_name exists in the services table
5. WHEN the system processes each CSV row THEN the system SHALL validate that appointment_date is not in the past (with optional admin override)
6. WHEN the system processes each CSV row THEN the system SHALL validate that appointment_time falls within business hours
7. WHEN the system processes each CSV row THEN the system SHALL validate that the appointment_date is not Sunday
8. WHEN the system processes each CSV row AND addons are specified THEN the system SHALL validate that each addon exists in the addons table
9. WHEN the system processes each CSV row AND payment_status is "Partially Paid" THEN the system SHALL validate that amount_paid is provided and valid
10. WHEN a row fails validation THEN the system SHALL collect the row number and specific error messages for reporting

### Requirement 14: Duplicate Detection

**User Story:** As an admin user, I want the system to detect potential duplicate appointments during CSV import, so that I don't accidentally create duplicate records.

#### Acceptance Criteria

1. WHEN the system processes each CSV row THEN the system SHALL check for existing appointments with the same customer_email, pet_name, appointment_date, and appointment_time
2. IF a potential duplicate is detected THEN the system SHALL flag the row as a duplicate
3. WHEN duplicates are detected THEN the system SHALL display a summary showing the number of duplicates found
4. WHEN duplicates are detected THEN the system SHALL provide options to: Skip duplicates, Overwrite duplicates, or Cancel import
5. IF the admin chooses "Skip duplicates" THEN the system SHALL import only non-duplicate rows
6. IF the admin chooses "Overwrite duplicates" THEN the system SHALL update existing appointments with CSV data
7. WHEN duplicates are skipped or overwritten THEN the system SHALL include this information in the import summary report

### Requirement 15: Customer and Pet Matching and Creation

**User Story:** As an admin user, I want the CSV import to automatically match existing customers and pets or create new ones, so that the import process is efficient and maintains data integrity.

#### Acceptance Criteria

1. WHEN the system processes each CSV row THEN the system SHALL search for an existing customer by email
2. IF a customer with the matching email exists THEN the system SHALL use that customer's ID for the appointment
3. IF no customer with the matching email exists THEN the system SHALL create a new customer record with the provided name, email, and phone
4. WHEN a customer is matched or created THEN the system SHALL search for an existing pet by name under that customer
5. IF a pet with the matching name exists for that customer THEN the system SHALL use that pet's ID for the appointment
6. IF no pet with the matching name exists THEN the system SHALL create a new pet record with the provided name, breed, size, and weight
7. WHEN creating a new customer or pet THEN the system SHALL apply the same validation rules as manual creation
8. IF customer or pet creation fails validation THEN the system SHALL mark that row as failed and include the error in the report

### Requirement 16: Batch Processing and Progress Feedback

**User Story:** As an admin user, I want to see progress while the CSV is being processed, so that I know the import is working and how long it will take.

#### Acceptance Criteria

1. WHEN the admin confirms the CSV import THEN the system SHALL display a progress indicator showing the percentage of rows processed
2. WHEN processing rows THEN the system SHALL update the progress indicator in real-time or at regular intervals
3. WHEN processing large files THEN the system SHALL process rows in batches to prevent timeout errors
4. IF the import is interrupted or fails THEN the system SHALL display an error message and report which rows were successfully processed before the failure
5. WHEN the import completes THEN the system SHALL display a detailed summary report

### Requirement 17: Import Summary Report

**User Story:** As an admin user, I want to receive a detailed summary after CSV import completes, so that I know what was imported successfully and what failed.

#### Acceptance Criteria

1. WHEN the CSV import completes THEN the system SHALL display a summary showing: total rows processed, successful imports, failed imports, duplicates skipped, duplicates overwritten
2. WHEN there are failed imports THEN the system SHALL display a table listing each failed row with: row number, customer email, pet name, and specific error messages
3. WHEN the summary is displayed THEN the system SHALL provide an option to download a detailed error report as a CSV file
4. WHEN the admin downloads the error report THEN the system SHALL include all original row data plus an "Error" column with the validation failure reason
5. WHEN the summary is displayed THEN the system SHALL provide a "Close" button to dismiss the modal and refresh the appointments list
6. WHEN appointments are successfully imported THEN the system SHALL refresh the appointments list to display the new appointments

### Requirement 18: CSV Import Transaction Handling

**User Story:** As an admin user, I want CSV imports to be processed reliably, so that partial failures don't leave the database in an inconsistent state.

#### Acceptance Criteria

1. WHEN the system processes a CSV import THEN the system SHALL use database transactions to ensure atomicity
2. IF any critical error occurs during import THEN the system SHALL roll back all changes made during that import session
3. WHEN processing individual rows THEN the system SHALL allow partial success (some rows succeed, some fail) unless the admin specifies all-or-nothing mode
4. IF the admin enables all-or-nothing mode AND any row fails THEN the system SHALL roll back the entire import
5. WHEN a row fails THEN the system SHALL log the error and continue processing subsequent rows (unless in all-or-nothing mode)

### Requirement 19: CSV Security and Sanitization

**User Story:** As a system administrator, I want CSV imports to be secure, so that malicious files cannot compromise the system or data.

#### Acceptance Criteria

1. WHEN the system receives a CSV file THEN the system SHALL scan for and reject files containing executable code or scripts
2. WHEN the system processes CSV data THEN the system SHALL sanitize all text inputs to prevent SQL injection attacks
3. WHEN the system processes CSV data THEN the system SHALL sanitize all text inputs to prevent XSS attacks
4. WHEN storing CSV data THEN the system SHALL validate and encode special characters appropriately
5. WHEN processing CSV files THEN the system SHALL limit the number of rows to 1000 per import to prevent resource exhaustion
6. IF a CSV exceeds 1000 rows THEN the system SHALL display an error "CSV files must contain 1000 rows or fewer. Please split your file and import in batches."
7. WHEN the CSV upload completes THEN the system SHALL delete the uploaded file from temporary storage after processing

### Requirement 20: Appointment Notifications Integration

**User Story:** As an admin user, I want manually created and CSV-imported appointments to trigger the same notifications as customer-created bookings, so that customers receive consistent communication.

#### Acceptance Criteria

1. WHEN an appointment is created manually THEN the system SHALL send a confirmation notification to the customer (email/SMS based on preferences)
2. WHEN appointments are created via CSV import THEN the system SHALL provide an option to "Send confirmation notifications to customers"
3. IF the admin enables notifications for CSV import THEN the system SHALL send confirmation notifications for all successfully imported appointments
4. IF the admin disables notifications for CSV import THEN the system SHALL create appointments without sending notifications
5. WHEN notifications are sent THEN the system SHALL use the existing notification templates and delivery logic
6. WHEN notifications fail to send THEN the system SHALL log the failure but still create the appointment successfully
7. WHEN the import summary is displayed AND notifications were enabled THEN the system SHALL show the count of notifications sent and any failures

### Requirement 21: Audit Trail for Manual and Imported Appointments

**User Story:** As a business owner, I want to track which appointments were created manually or via import and by which admin user, so that I can maintain accountability and audit history.

#### Acceptance Criteria

1. WHEN an appointment is created manually THEN the system SHALL record the admin user ID who created it
2. WHEN an appointment is created via CSV import THEN the system SHALL record the admin user ID who performed the import
3. WHEN storing appointment metadata THEN the system SHALL include a creation_method field with values: "customer_booking", "manual_admin", or "csv_import"
4. WHEN storing appointment metadata THEN the system SHALL include a created_at timestamp
5. WHEN viewing appointment details in the admin panel THEN the system SHALL display the creation method and admin user who created it
6. WHEN an imported or manually created appointment is modified THEN the system SHALL preserve the original creation metadata

### Requirement 22: Pricing Calculation for Imports

**User Story:** As an admin user, I want CSV imports to automatically calculate appointment costs based on current pricing, so that imported appointments have accurate pricing without manual calculation.

#### Acceptance Criteria

1. WHEN the system processes a CSV row THEN the system SHALL look up the current price for the specified service and pet size from the service_prices table
2. WHEN addons are specified in the CSV THEN the system SHALL look up the current price for each addon from the addons table
3. WHEN calculating the total appointment cost THEN the system SHALL sum the service price and all addon prices
4. WHEN the CSV includes pricing information THEN the system SHALL ignore it and use current database pricing
5. WHEN pricing is not available for a service/size combination THEN the system SHALL mark the row as failed with error "Pricing not configured for [service] - [size]"
6. WHEN the appointment is created THEN the system SHALL store the calculated total cost in the appointments table
