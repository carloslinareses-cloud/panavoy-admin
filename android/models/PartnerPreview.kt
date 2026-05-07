package com.panavoy.models

data class PartnerPreview(
    val uid: String = "",
    val type: String = "", // "tiendas", "choferes", "taxis"
    val roleName: String = "", // "Tienda", "Delivery", "Taxi"
    val nombre: String = "",
    val email: String = "",
    val telefono: String = "",
    val pagoMovilBanco: String = "",
    val pagoMovilTelefono: String = "",
    val pagoMovilCedula: String = "",
    val marcaVehiculo: String = "",
    val modeloVehiculo: String = "",
    val placa: String = ""
)
