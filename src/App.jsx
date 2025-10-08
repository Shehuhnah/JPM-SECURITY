import Router from "./Routes/router.jsx";

function App() {
  return (
    <>
      <div className="
        bg-red-500 
        xs:bg-green-500   /* phones */
        sm:bg-blue-500    /* big phones */
        md:bg-yellow-500  /* tablets */
        lg:bg-purple-500  /* laptops */
        xl:bg-pink-500    /* desktops */
        2xl:bg-orange-500 /* large screens */
        3xl:bg-teal-500   /* extra large monitors */
      ">
        {/* Responsive Meter */}
      </div>
      <Router />
    </>
  )
}
export default App;

