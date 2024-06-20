provider "google" {
  project     = var.project
  region      = var.region
}

resource "google_project_service" "run" {
  project = var.project
  service = "run.googleapis.com"
}

resource "google_project_service" "build" {
  project = var.project
  service = "cloudbuild.googleapis.com"
}

resource "google_cloud_run_service" "default" {
  name     = var.service_name
  location = var.region

  template {
    spec {
      containers {
        image = var.image
        resources {
          limits = {
            memory = "512Mi"
            cpu    = "1"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.run,
    google_project_service.build
  ]
}

resource "google_cloud_run_service_iam_member" "public" {
  service    = google_cloud_run_service.default.name
  location   = google_cloud_run_service.default.location
  project    = var.project
  role       = "roles/run.invoker"
  member     = "allUsers"
}
