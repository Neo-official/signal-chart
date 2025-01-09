import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
	size?: number;
};
// export default function AdminPage() {
//   const router = useRouter();
//   const [isAuthorized, setIsAuthorized] = useState(false);
//
//   useEffect(() => {
//     // Check if user is authenticated
//     const isAuthenticated = sessionStorage.getItem("isAuthenticated");
//     const userRole = sessionStorage.getItem("userRole");
//
//     if (!isAuthenticated || userRole !== "admin") {
//       router.push("/login");
//     } else {
//       setIsAuthorized(true);
//     }
//   }, [router]);
//
//   const handleLogout = () => {
//     sessionStorage.removeItem("isAuthenticated");
//     sessionStorage.removeItem("userRole");
//     router.push("/login");
//   };
//
//   if (!isAuthorized) {
//     return null; // Or loading spinner
//   }
//
//   return (
//     <div className="p-8">
//       <Card>
//         <CardBody>
//           <div className="flex justify-between items-center mb-4">
//             <h1 className="text-2xl font-bold">Admin Dashboard</h1>
//             <Button color="danger" onClick={handleLogout}>
//               Logout
//             </Button>
//           </div>
//           {/* Add your admin content here */}
//           <p>Welcome to the admin area!</p>
//         </CardBody>
//       </Card>
//     </div>
//   );
// }
export type Settings = {
	maxDataPoints: number
	maxDataSend: number
}

export type DeviceType = {
	id: string
	state: 'ban' | 'pending' | 'active'
	scale: number
	data: [number, number][]
	labels: number[]
};

// export * from "./canvasjs";