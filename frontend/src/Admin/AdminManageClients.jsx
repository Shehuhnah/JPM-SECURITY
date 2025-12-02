import { useState, useEffect, Fragment } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Building, Pencil, RefreshCcw, Trash, UserPlus, Search } from "lucide-react";
import { Dialog, Transition } from '@headlessui/react';

const api = import.meta.env.VITE_API_URL;

const ClientModal = ({ isOpen, onClose, onSave, client }) => {
    const [formData, setFormData] = useState({
        clientName: '',
        clientAddress: '',
        clientContactPerson: '',
        clientContact: '',
        clientTypeOfEstablishment: ''
    });

    useEffect(() => {
        if (client) setFormData(client);
        else setFormData({
            clientName: '',
            clientAddress: '',
            clientContactPerson: '',
            clientContact: '',
            clientTypeOfEstablishment: ''
        });
    }, [client, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
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
                    <div className="fixed inset-0 bg-black bg-opacity-50" />
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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#1e293b] p-8 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                                    <Pencil className="text-blue-400 w-8 h-8"/>
                                    <div className="">
                                        <p>{client ? 'Edit Client' : 'Add New Client'}</p>
                                        <p className="font-normal text-sm">{client ? 'Edit client credentials' : 'Add new client'}</p>
                                    </div>
                                </Dialog.Title>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-300 mb-1">Client Name</label>
                                            <input id="clientName" type="text" name="clientName" value={formData.clientName} onChange={handleChange} placeholder="Enter client name" className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2 text-gray-100" required />
                                        </div>
                                        <div>
                                            <label htmlFor="clientContactPerson" className="block text-sm font-medium text-gray-300 mb-1">Contact Person</label>
                                            <input id="clientContactPerson" type="text" name="clientContactPerson" value={formData.clientContactPerson} onChange={handleChange} placeholder="Enter contact person's name" className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2 text-gray-100" required />
                                        </div>
                                        <div>
                                            <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                                            <input id="clientAddress" type="text" name="clientAddress" value={formData.clientAddress} onChange={handleChange} placeholder="Enter client address" className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2 text-gray-100" required />
                                        </div>
                                        <div>
                                            <label htmlFor="clientContact" className="block text-sm font-medium text-gray-300 mb-1">Contact Number</label>
                                            <input id="clientContact" type="text" name="clientContact" value={formData.clientContact} onChange={handleChange} placeholder="Enter contact number" className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2 text-gray-100" required />
                                        </div>
                                        <div className="md:col-span-2"> 
                                            <label htmlFor="clientTypeOfEstablishment" className="block text-sm font-medium text-gray-300 mb-1">Type of Establishment</label>
                                            <input id="clientTypeOfEstablishment" type="text" name="clientTypeOfEstablishment" value={formData.clientTypeOfEstablishment} onChange={handleChange} placeholder="e.g., Commercial, Residential" className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2 text-gray-100" required />
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-4">
                                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">Cancel</button>
                                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save</button>
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

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, client }) => {
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
                    <div className="fixed inset-0 bg-black bg-opacity-50" />
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1e293b] p-8 text-left align-middle shadow-xl transition-all text-white">
                                <Dialog.Title as="h3" className="text-2xl font-bold mb-4 border-b pb-4 text-red-600">
                                    Confirm Deletion
                                </Dialog.Title>
                                <p>Are you sure you want to delete the client "{client?.clientName}"?</p>
                                <div className="flex justify-end space-x-4 mt-8">
                                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">Cancel</button>
                                    <button type="button" onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Delete</button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default function AdminManageClients() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [uniqueEstablishmentTypes, setUniqueEstablishmentTypes] = useState([]);

    useEffect(() => {
        if (!loading && !user) {
            navigate("/admin/login");
        }
        document.title = "Manage Clients | JPM Security Agency";
        fetchClients();
    }, [user, loading, navigate]);

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${api}/api/clients/get-clients`, {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Failed to fetch clients");
            }
            const data = await response.json();
            setClients(data);

            // Extract unique establishment types
            const types = [...new Set(data.map(client => client.clientTypeOfEstablishment))];
            setUniqueEstablishmentTypes(types);

        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = () => {
        setFilter("All");
        setSearch("");
        fetchClients();
    }

    const openModal = (client = null) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedClient(null);
        setIsModalOpen(false);
    };

    const handleSave = async (clientData) => {
        const url = selectedClient 
            ? `${api}/api/clients/${selectedClient._id}` 
            : `${api}/api/clients/create-client`;
        const method = selectedClient ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(clientData),
            });
            const resData = await response.json();
            if (!response.ok) {
                throw new Error(resData.message || (selectedClient ? 'Failed to update client' : 'Failed to create client'));
            }
            fetchClients();
            closeModal();
            toast.success(`Client ${selectedClient ? 'updated' : 'added'} successfully!`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const openDeleteModal = (client) => {
        setClientToDelete(client);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setClientToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleDelete = async () => {
        if (!clientToDelete) return;
        try {
            const response = await fetch(`${api}/api/clients/${clientToDelete._id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const resData = await response.json();
            if (!response.ok) {
                throw new Error(resData.message || 'Failed to delete client');
            }
            fetchClients();
            closeDeleteModal();
            toast.success('Client deleted successfully!');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const filteredClients = clients.filter(client => {
        const matchesFilter = filter === "All" || client.clientTypeOfEstablishment === filter;
        const matchesSearch = client.clientName.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <>
            <section className="min-h-screen bg-[#0f172a] text-gray-100 px-4 sm:px-6 lg:px-8 py-12">
                <div className="w-full ">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Building className="text-blue-400 w-8 h-8"/>
                            Manage Clients
                        </h1>
                        <div className="flex items-center gap-x-2">
                             <button
                                onClick={handleRefresh}
                                className="flex items-center justify-center px-4 py-2 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition-colors duration-200"
                                title="Refresh List"
                            >
                                <RefreshCcw className="w-5 h-5" />
                            </button>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="border border-gray-700 px-3 py-2 rounded-md bg-[#1e293b] text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="All">All Types</option>
                                {uniqueEstablishmentTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search client..."
                                className="pl-9 pr-3 py-2 w-full sm:w-64 rounded-md bg-[#1e293b] border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                <UserPlus className="mr-2" /> Add Client
                            </button>
                        </div>
                    </div>

                    {isLoading && <p>Loading clients...</p>}
                    {error && <p className="text-red-500">{error}</p>}

                    {!isLoading && !error && (
                        <div className="bg-[#1e293b]/70 backdrop-blur-md border border-gray-700 rounded-2xl  shadow-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-[#10263a] tracking-wide text-xs md:text-sm uppercase font-semibold">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs  text-gray-300 uppercase tracking-wider">Client Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs  text-gray-300 uppercase tracking-wider">Address</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs  text-gray-300 uppercase tracking-wider">Contact Person</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs  text-gray-300 uppercase tracking-wider">Contact</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs  text-gray-300 uppercase tracking-wider">Establishment Type</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs  text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map((client) => (
                                        <tr key={client._id} className="border-t border-gray-700 hover:bg-blue-900/20 transition ">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{client.clientName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.clientAddress}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.clientContactPerson}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.clientContact}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.clientTypeOfEstablishment}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openModal(client)}
                                                    className="text-blue-400 hover:text-blue-600 mr-4"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(client)}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <Trash size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {filteredClients.length === 0 && !isLoading && !error && (
                        <div className="text-center py-8 bg-[#1e293b] rounded-2xl mt-4">
                            <p className="text-gray-400">No clients found. Add a new one to get started.</p>
                        </div>
                    )}
                </div>
            </section>
            <ClientModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} client={selectedClient} />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} onConfirm={handleDelete} client={clientToDelete} />
            <ToastContainer theme="dark" />
        </>
    );
}