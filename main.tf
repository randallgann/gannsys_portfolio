provider "google" {
  project = var.project
  region  = var.region
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
}

resource "google_cloud_run_service_iam_member" "public" {
  service    = google_cloud_run_service.default.name
  location   = google_cloud_run_service.default.location
  project    = var.project
  role       = "roles/run.invoker"
  member     = "allUsers"
}
