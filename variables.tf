variable "project" {
  description = "The project ID to deploy to"
  type        = string
}

variable "region" {
  description = "The region to deploy to"
  type        = string
}

variable "image" {
  description = "The Docker image to deploy"
  type        = string
}

variable "service_name" {
  description = "The name of the Cloud Run service"
  type        = string
}

variable "credentials_file_path" {
  description = "The path to the service account JSON key file"
  type        = string
}
