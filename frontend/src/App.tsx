import Navbar from "./components/Navbar";
import {useLocation, Route, Routes} from "react-router";
import Login from "./scenes/Login";


function App() {

    const location = useLocation();

    const showNavbar = location.pathname !== "/login";
    return (
        <>

            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=bar_chart_4_bars,home_app_logo,man,notifications,settings"/>

            {showNavbar && <Navbar />}

            <Routes>
                <Route path="/login"  element={<Login/>} />

            </Routes>

        </>
    )
}

export default App
