
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }
}

# UAE Region (Primary)
provider "aws" {
  alias  = "uae"
  region = "me-south-1"
}

# KSA Region
provider "aws" {
  alias  = "ksa"
  region = "me-central-1"
}

# EKS Cluster - UAE
module "eks_uae" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"
  
  providers = {
    aws = aws.uae
  }
  
  cluster_name    = "salon-backend-uae"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc_uae.vpc_id
  subnet_ids = module.vpc_uae.private_subnets
  
  node_groups = {
    main = {
      desired_capacity = 3
      max_capacity     = 20
      min_capacity     = 2
      
      instance_types = ["t3.large"]
    }
  }
}

# MongoDB Atlas (Managed sharding)
resource "mongodbatlas_cluster" "salon_sharded" {
  project_id = var.project_id
  name       = "salon-sharded-cluster"
  
  cluster_type = "SHARDED"
  
  replication_specs {
    num_shards = 3
    regions_config {
      region_name     = "ME_SOUTH_1"
      electable_nodes = 3
      priority        = 7
      read_only_nodes = 0
    }
  }
}

# Redis Enterprise for cross-region
resource "rediscloud_subscription" "global_cache" {
  name = "salon-global-cache"
  
  cloud_provider {
    provider = "AWS"
    region {
      region = "me-south-1"
      multiple_availability_zones = true
    }
    region {
      region = "me-central-1"
      multiple_availability_zones = true
    }
  }
}
