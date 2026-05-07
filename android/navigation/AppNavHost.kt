package com.panavoy.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.panavoy.admin.AdminViewModel
import com.panavoy.screens.PendingApprovalsScreen

object Screen {
    const val PendingApprovals = "pending_approvals"
}

@Composable
fun AppNavHost(navController: NavHostController, adminViewModel: AdminViewModel) {
    NavHost(navController = navController, startDestination = Screen.PendingApprovals) {
        composable(Screen.PendingApprovals) {
            PendingApprovalsScreen(viewModel = adminViewModel, onBackClick = { navController.popBackStack() })
        }
    }
}
