module "app" {
  source               = "../../modules/app"
  credentials_file_path = var.credentials_file_path
  project              = var.project
  region               = var.region
  image                = var.image
  service_name         = var.service_name
}

resource "google_cloud_run_domain_mapping" "domain-pro" {
  name     = "gannsystems.pro"
  location = module.app.cloud_run_service_location
  project  = module.app.project_id 
  metadata {
    namespace = module.app.project_id
  }
  spec {
    route_name = module.app.cloud_run_service_name
  }
}

resource "google_cloud_run_domain_mapping" "default" {
  name     = "gannsystems.com"
  location = module.app.cloud_run_service_location
  project  = module.app.project_id 
  metadata {
    namespace = module.app.project_id
  }
  spec {
    route_name = module.app.cloud_run_service_name
  }
}