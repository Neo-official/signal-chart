import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<section className="flex flex-col items-center justify-center gap-4 py-8">
			<div className="w-full max-w-7xl mx-auto space-y-6">
				<div className="space-y-1">
					<Skeleton className="h-9 w-64" />
					<Skeleton className="h-5 w-80" />
				</div>
				<div className="flex justify-between items-center border-b pb-4">
					<div className="flex gap-2">
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-10 w-24" />
					</div>
				</div>
				<div className="space-y-4 pt-4">
					<div className="flex justify-between items-center">
						<div className="space-y-1">
							<Skeleton className="h-8 w-32" />
							<Skeleton className="h-5 w-40" />
						</div>
						<div className="flex items-center gap-2">
							<Skeleton className="h-10 w-[120px]" />
							<Skeleton className="h-10 w-24" />
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-4" />
						<Skeleton className="h-10 w-[140px]" />
						<Skeleton className="h-10 w-[140px]" />
					</div>
				</div>
				<div className="space-y-4">
					{[1, 2].map((i) => (
						<Card key={i} className="w-full">
							<CardHeader className="pb-4">
								<div className="flex justify-between items-start gap-4">
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-2">
											<Skeleton className="h-7 w-32" />
											<Skeleton className="h-6 w-16 rounded-full" />
											<Skeleton className="h-6 w-16 rounded-full" />
										</div>
										<Skeleton className="h-5 w-64" />
									</div>
									<div className="flex items-center gap-2">
										<Skeleton className="h-8 w-20" />
										<Skeleton className="h-8 w-24" />
										<Skeleton className="h-8 w-20" />
										<Skeleton className="h-8 w-8" />
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<Skeleton className="h-[400px] w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
