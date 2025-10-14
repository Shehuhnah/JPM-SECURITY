import { Link } from 'react-router-dom';

export default function Home (){
    
    return (
        <>
            <div
                className="min-h-screen bg-center bg-repeat text-white flex items-center justify-center px-4"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23333' fill-opacity='0.15'%3E%3Cpath d='M0 0h10v10H0zM10 10h10v10H10z'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundColor: '#111',
                    backgroundSize: '40px 40px',
                }}
                >
                <div className="bg-black bg-opacity-70 p-6 md:p-12 rounded-xl shadow-2xl text-center max-w-md w-full space-y-6">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                    JPM Security Agency
                    </h2>

                    <Link to="/MainPage">
                    <button className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-full text-base transition-all duration-300 w-full md:w-auto">
                        Auq Nah
                    </button>
                    </Link>
                </div>
            </div>
        </>
    )
}