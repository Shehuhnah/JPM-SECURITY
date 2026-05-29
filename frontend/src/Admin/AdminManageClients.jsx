import { useState, useEffect, Fragment } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Building,
  Pencil,
  RefreshCcw,
  Trash,
  UserPlus,
  Search,
  Filter,
  X,
  MapPin,
  Phone,
  User
} from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import TablePagination from "../components/admin/TablePagination.jsx";

const api = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;
const toPhilippinesMobile = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("639") && digits.length >= 12) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith("09") && digits.length >= 11) return `+63${digits.slice(1, 11)}`;
  if (digits.startsWith("9") && digits.length >= 10) return `+63${digits.slice(0, 10)}`;
  return `+63${digits.slice(0, 10)}`;
};

// --- Components ---

const ClientModal = ({ isOpen, onClose, onSave, client }) => {
  const [formData, setFormData] = useState({
    clientName: "",
    clientAddress: "",
    clientContactPerson: "",
    clientContact: "",
    clientTypeOfEstablishment: "",
  });

  useEffect(() => {
    if (client) setFormData({ ...client, clientContact: toPhilippinesMobile(client.clientContact) });
    else
      setFormData({
        clientName: "",
        clientAddress: "",
        clientContactPerson: "",
        clientContact: "",
        clientTypeOfEstablishment: "",
      });
  }, [client, isOpen]);

  const handleChange = (e) =>
    setFormData((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.name === "clientContact"
          ? toPhilippinesMobile(e.target.value)
          : e.target.value,
    }));
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!/^\+63\d{10}$/.test(formData.clientContact)) {
      toast.error("Contact number must be in +63 format.", { theme: "dark", transition: Bounce });
      return;
    }
    onSave(formData);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-blue-500/20 bg-[#0f172a] text-left align-middle shadow-2xl shadow-black/50">
                <div className="sticky top-0 z-10 border-b border-blue-500/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(15,23,42,0.98))] px-6 py-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">{client ? "Edit Client" : "New Client"}</div>
                    <h3 className="mt-1 text-xl font-semibold text-white">{client ? "Update Client Profile" : "Add New Client"}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {client ? "Update the establishment details and contact information." : "Register a new establishment and keep the directory ready for deployment."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Client Overview</div>
                        <div className="mt-3 space-y-3 text-sm">
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3">
                            <span className="text-slate-500">Name</span>
                            <span className="truncate text-right text-white font-medium">{formData.clientName || "Required"}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3">
                            <span className="text-slate-500">Type</span>
                            <span className="truncate text-right text-slate-300">{formData.clientTypeOfEstablishment || "Required"}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3">
                            <span className="text-slate-500">Contact</span>
                            <span className="truncate text-right text-slate-300">{formData.clientContact ? `+63${formData.clientContact.replace(/^\+63/, "")}` : "Required"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Client Name <span className="text-red-400">*</span></label>
                          <input
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleChange}
                            placeholder="e.g. ABC Corporation"
                            className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-500/60"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Contact Person <span className="text-red-400">*</span></label>
                          <input
                            name="clientContactPerson"
                            value={formData.clientContactPerson}
                            onChange={handleChange}
                            placeholder="e.g. John Doe"
                            className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-500/60"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Address <span className="text-red-400">*</span></label>
                          <input
                            name="clientAddress"
                            value={formData.clientAddress}
                            onChange={handleChange}
                            placeholder="Full Establishment Address"
                            className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-500/60"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Contact Number <span className="text-red-400">*</span></label>
                          <div className="flex items-center overflow-hidden rounded-xl border border-gray-700 bg-[#1e293b] focus-within:ring-2 focus-within:ring-blue-500/60">
                            <span className="border-r border-gray-700 bg-white/5 px-4 py-3 text-sm font-semibold text-white">+63</span>
                            <input
                              name="clientContact"
                              value={formData.clientContact.replace(/^\+63/, "")}
                              onChange={handleChange}
                              placeholder="9123456789"
                              className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Establishment Type <span className="text-red-400">*</span></label>
                          <input
                            name="clientTypeOfEstablishment"
                            value={formData.clientTypeOfEstablishment}
                            onChange={handleChange}
                            placeholder="e.g. Mall, Bank, Residential"
                            className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-500/60"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                          {client ? "Update Client" : "Save Client"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, client }) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      </Transition.Child>
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1e293b] p-6 text-left align-middle shadow-xl border border-gray-700 transition-all">
              <Dialog.Title as="h3" className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-full"><Trash className="text-red-500" size={24} /></div>
                Confirm Deletion
              </Dialog.Title>
              <p className="text-gray-400 mt-2">
                Are you sure you want to delete <span className="text-white font-semibold">{client?.clientName}</span>?
              </p>
              <p className="text-sm text-red-400 mt-2 italic">* This action cannot be undone.</p>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium transition">
                  Cancel
                </button>
                <button type="button" onClick={onConfirm} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm font-medium shadow-lg shadow-red-900/20 transition">
                  Delete
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

// --- Main Page ---

export default function AdminManageClients() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [uniqueTypes, setUniqueTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login");
    document.title = "Manage Clients | JPM Security Agency";
  }, [user, loading, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (user) {
      fetchClients(currentPage);
    }
  }, [user, currentPage, search, filter]);

  const fetchClients = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (search.trim()) params.set("q", search.trim());
      if (filter !== "All") params.set("type", filter);

      const response = await fetch(`${api}/api/clients/get-clients?${params.toString()}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      setClients(data.items || []);
      setUniqueTypes(data.types || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error("Error loading clients", { theme: "dark", transition: Bounce });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (clientData) => {
    const url = selectedClient ? `${api}/api/clients/${selectedClient._id}` : `${api}/api/clients/create-client`;
    const method = selectedClient ? "PUT" : "POST";
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(clientData),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Action failed");
      
      fetchClients();
      setIsModalOpen(false);
      toast.success(selectedClient ? "Client updated!" : "Client added successfully!", { theme: "dark", transition: Bounce });
    } catch (error) {
      toast.error(error.message, { theme: "dark", transition: Bounce });
    }
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      const response = await fetch(`${api}/api/clients/${clientToDelete._id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error((await response.json()).message || "Failed to delete");
      
      fetchClients();
      setIsDeleteModalOpen(false);
      toast.success("Client deleted successfully!", { theme: "dark", transition: Bounce });
    } catch (error) {
      toast.error(error.message, { theme: "dark", transition: Bounce });
    }
  };

  const openModal = (client = null) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const openDeleteModal = (client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />
      
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 gap-6">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                <Building className="text-blue-500" size={28} />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Manage Clients</h1>
                <p className="text-slate-400 text-sm mt-1">Directory of all partner establishments.</p>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search client..."
                    className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
            </div>

            {/* Filter */}
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={14} />
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full sm:w-auto bg-[#1e293b] border border-gray-700 text-gray-200 rounded-lg pl-9 pr-8 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                    <option value="All">All Types</option>
                    {uniqueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={fetchClients}
                    className="px-3 py-2 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition flex items-center justify-center"
                    title="Refresh List"
                >
                    <RefreshCcw size={20} />
                </button>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap shadow-lg shadow-blue-900/20"
                >
                    <UserPlus size={18} /> Add Client
                </button>
            </div>
        </div>
      </header>

      {/* Content */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-1 shadow-xl min-h-[600px]">
        {isLoading ? (
             <div className="flex flex-col items-center justify-center h-[600px] text-blue-400 animate-pulse">
                <Building size={48} className="mb-4 opacity-50" />
                <p>Loading clients...</p>
             </div>
        ) : clients.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-[600px] text-gray-500">
                <Building size={48} className="mb-4 opacity-20" />
                <p>No clients found matching criteria.</p>
             </div>
        ) : (
            <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden bg-[#1e293b] rounded-xl border border-gray-700">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0f172a] text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">#</th>
                                <th className="px-6 py-4 font-semibold">Client Details</th>
                                <th className="px-6 py-4 font-semibold">Contact Person</th>
                                <th className="px-6 py-4 font-semibold">Contact No.</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {clients.map((client, index) => (
                                <tr key={client._id} className="group hover:bg-slate-800/50 transition">
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{client.clientName}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <MapPin size={12}/> {client.clientAddress}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-gray-500"/> {client.clientContactPerson}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} className="text-gray-500"/> {client.clientContact}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            {client.clientTypeOfEstablishment}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => openModal(client)} 
                                                className="p-2 bg-blue-500/5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all border border-blue-500/10 hover:border-blue-500/30" 
                                                title="Edit"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button 
                                                onClick={() => openDeleteModal(client)} 
                                                className="p-2 bg-red-500/5 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/10 hover:border-red-500/30" 
                                                title="Delete"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden grid gap-4 p-4">
                    {clients.map((client, index) => (
                        <div key={client._id} className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">#{(currentPage - 1) * PAGE_SIZE + index + 1}</p>
                                    <h3 className="font-bold text-white text-lg">{client.clientName}</h3>
                                    <span className="text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-900/50">{client.clientTypeOfEstablishment}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openModal(client)} className="p-2 bg-slate-800 rounded-lg text-gray-400 hover:text-blue-400">
                                        <Pencil size={16}/>
                                    </button>
                                    <button onClick={() => openDeleteModal(client)} className="p-2 bg-slate-800 rounded-lg text-gray-400 hover:text-red-400">
                                        <Trash size={16}/>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-300 border-t border-gray-700 pt-3 mt-1">
                                <div className="flex items-start gap-2">
                                    <MapPin size={16} className="text-gray-500 shrink-0 mt-0.5"/>
                                    {client.clientAddress}
                                </div>
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-gray-500"/>
                                    {client.clientContactPerson}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-gray-500"/>
                                    {client.clientContact}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-4 pb-4 md:px-6">
                    <TablePagination
                      page={currentPage}
                      limit={PAGE_SIZE}
                      totalItems={totalItems}
                      currentCount={clients.length}
                      totalPages={totalPages}
                      label="clients"
                      onPageChange={setCurrentPage}
                    />
                </div>
            </>
        )}
      </div>

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        client={selectedClient} 
      />
      
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDelete} 
        client={clientToDelete} 
      />
    </div>
  );
}
