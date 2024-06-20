module "app" {
  source               = "../../modules/app"
  credentials_file_path = var.credentials_file_path
  project              = var.project
  region               = var.region
  image                = var.image
  service_name         = var.service_name
}
