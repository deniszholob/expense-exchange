// import { MaxLengthValidator, ValidationErrors } from "@angular/forms";

// export type ErrorDetails = unknown & MaxLengthErrorDetails;
// export interface MaxLengthErrorDetails {
//     requiredLength: number;
//     actualLength: number;
// }
// export interface FieldError {
//     name: string;
//     details: ErrorDetails;
// }
// export interface ValidationMessage {
//     name: string;
//     message: string;
// }

// export const FORM_FIELDS_VALIDATION_MESSAGES: ValidationMessage[] = [

// ]

// export function getErrorMessages(errors?: ValidationErrors): string[] {
//     return validationErrorsToArray(errors).map((error) => getErrorMessage(error));
// }

// function validationErrorsToArray(errors?: ValidationErrors): FieldError[] {
//     return (errors ? Object.entries(errors) : []).map(
//         ([name, details]:[string, ErrorDetails]):FieldError =>({
//             name, details
//         })
//     )
// }

// function getErrorMessage(error: FieldError): string {
//     return FORM_FIELDS_VALIDATION_MESSAGES.find(
//         (message) => message.name === error.name
//     )?.details.message;
// }
