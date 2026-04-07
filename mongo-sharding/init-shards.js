
// Connect to mongos
// sh.enableSharding("salon_db")

// Shard by tenant_id (hashed)
// sh.shardCollection("salon_db.appointments", { "tenant_id": "hashed" })
// sh.shardCollection("salon_db.customers", { "tenant_id": "hashed" })
// sh.shardCollection("salon_db.services", { "tenant_id": "hashed" })

// Zone sharding for compliance (UAE data stays in UAE)
// sh.addShardToZone("shard01", "UAE")
// sh.addShardToZone("shard02", "KSA")
// sh.addShardToZone("shard03", "QATAR")

// Tag ranges for data residency
// sh.updateZoneKeyRange("salon_db.customers", { "tenant_country": "UAE" }, { "tenant_country": "UAE" }, "UAE")
// sh.updateZoneKeyRange("salon_db.customers", { "tenant_country": "KSA" }, { "tenant_country": "KSA" }, "KSA")

print("Sharding configuration complete")
