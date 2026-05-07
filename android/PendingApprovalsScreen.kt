package com.panavoy.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.panavoy.components.PartnerApprovalCard
import com.panavoy.admin.AdminViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PendingApprovalsScreen(viewModel: AdminViewModel, onBackClick: () -> Unit) {
    val pendingList by viewModel.pendingPartners.collectAsState()
    BackHandler { onBackClick() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Aprobaciones Pendientes", fontWeight = FontWeight.Black) },
                navigationIcon = { IconButton(onClick = onBackClick) { Icon(Icons.Default.ArrowBack, "Volver") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0F172A), titleContentColor = Color.White, navigationIconContentColor = Color.White)
            )
        },
        containerColor = Color(0xFF0F172A)
    ) { paddingValues ->
        if (pendingList.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                Text("No hay solicitudes pendientes.", color = Color.Gray)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(paddingValues).padding(horizontal = 16.dp), 
                contentPadding = PaddingValues(vertical = 16.dp), 
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(pendingList, key = { it.uid }) { partner ->
                    PartnerApprovalCard(
                        partner = partner, 
                        onApprove = { viewModel.approvePartner(partner.type, partner.uid) }, 
                        onReject = { viewModel.rejectPartner(partner.type, partner.uid) }
                    )
                }
            }
        }
    }
}

// PartnerApprovalCard is implemented in com.panavoy.components.PartnerApprovalCard
