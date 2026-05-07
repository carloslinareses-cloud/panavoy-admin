package com.panavoy.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.panavoy.models.PartnerPreview

val BrandGreen = Color(0xFF118C4F)
val AlertRed = Color(0xFFD32F2F)
val AccentAmber = Color(0xFFFFCA28)

@Composable
fun PartnerApprovalCard(partner: PartnerPreview, onApprove: () -> Unit, onReject: () -> Unit) {
    val badgeColor = when (partner.type) { "tiendas" -> AccentAmber; "choferes" -> BrandGreen; "taxis" -> Color(0xFF3B82F6); else -> Color.Gray }

    Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)), elevation = CardDefaults.cardElevation(defaultElevation = 4.dp), modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(text = partner.nombre.ifEmpty { "Sin Nombre" }, color = Color.White, fontWeight = FontWeight.Black, fontSize = 20.sp, modifier = Modifier.weight(1f))
                Surface(shape = RoundedCornerShape(8.dp), color = badgeColor.copy(alpha = 0.2f), contentColor = badgeColor) {
                    Text(text = partner.roleName.uppercase(), fontWeight = FontWeight.Bold, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), letterSpacing = 1.sp)
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = "📞 ${partner.telefono}", color = Color.LightGray, fontSize = 14.sp)
            Text(text = "✉️ ${partner.email}", color = Color.LightGray, fontSize = 14.sp)
            Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color.Gray.copy(alpha = 0.3f))
            Text("MÉTODO DE LIQUIDACIÓN (PAGO MÓVIL)", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
            Text("Banco: ${partner.pagoMovilBanco.ifEmpty { "No registrado" }}", color = Color.White, fontSize = 14.sp)
            Text("Teléfono: ${partner.pagoMovilTelefono}", color = Color.White, fontSize = 14.sp)
            Text("Cédula: ${partner.pagoMovilCedula}", color = Color.White, fontSize = 14.sp)
            
            if (partner.type == "choferes" || partner.type == "taxis") {
                Spacer(modifier = Modifier.height(8.dp))
                Text("VEHÍCULO", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                Text("${partner.marcaVehiculo} ${partner.modeloVehiculo} • Placa: ${partner.placa}", color = AccentAmber, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.height(20.dp))
            Button(onClick = onApprove, colors = ButtonDefaults.buttonColors(containerColor = BrandGreen), shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth().height(56.dp)) {
                Text("APROBAR SOCIO", color = Color.White, fontWeight = FontWeight.Black, fontSize = 16.sp)
            }
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedButton(onClick = onReject, colors = ButtonDefaults.outlinedButtonColors(contentColor = AlertRed), border = androidx.compose.foundation.BorderStroke(2.dp, AlertRed), shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth().height(56.dp)) {
                Text("RECHAZAR SOLICITUD", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }
    }
}
