package com.panavoy.admin

import androidx.lifecycle.ViewModel
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import com.panavoy.models.PartnerPreview

class AdminViewModel : ViewModel() {
    private val db = FirebaseDatabase.getInstance().reference

    private val _pendingPartners = MutableStateFlow<List<PartnerPreview>>(emptyList())
    val pendingPartners: StateFlow<List<PartnerPreview>> = _pendingPartners.asStateFlow()

    private var pendingTiendas = listOf<PartnerPreview>()
    private var pendingChoferes = listOf<PartnerPreview>()
    private var pendingTaxis = listOf<PartnerPreview>()

    init { fetchPendingPartners() }

    private fun fetchPendingPartners() {
        setupListener("tiendas", "Tienda") { list -> pendingTiendas = list; updateUnifiedFlow() }
        setupListener("choferes", "Delivery") { list -> pendingChoferes = list; updateUnifiedFlow() }
        setupListener("taxis", "Taxi") { list -> pendingTaxis = list; updateUnifiedFlow() }
    }

    private fun setupListener(nodeName: String, roleName: String, onUpdate: (List<PartnerPreview>) -> Unit) {
        val query = db.child("socios").child(nodeName).orderByChild("status").equalTo("pending")
        query.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val list = mutableListOf<PartnerPreview>()
                for (child in snapshot.children) {
                    val partner = child.getValue(PartnerPreview::class.java)
                    if (partner != null) list.add(partner.copy(uid = child.key ?: "", type = nodeName, roleName = roleName))
                }
                onUpdate(list)
            }
            override fun onCancelled(error: DatabaseError) {}
        })
    }

    private fun updateUnifiedFlow() {
        _pendingPartners.update { (pendingTiendas + pendingChoferes + pendingTaxis).sortedBy { it.nombre } }
    }

    fun approvePartner(type: String, uid: String) { db.child("socios").child(type).child(uid).child("status").setValue("approved") }
    fun rejectPartner(type: String, uid: String) { db.child("socios").child(type).child(uid).child("status").setValue("rejected") }
}
