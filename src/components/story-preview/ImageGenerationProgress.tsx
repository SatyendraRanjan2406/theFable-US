import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, ChevronLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';

interface ImageGenerationProgressProps {
	generatedCount: number;
	totalPanels: number;
	loadingCount: number;
	onBackToForm?: () => void;
	generationTarget?: number;
	characterPhotoUrl?: string | null;
	selectedPhotoForStory?: string | null; // The photo user selected for story (original or cartoon)
	isCartoonSelectedForStory?: boolean; // Whether cartoon was selected
	error?: boolean;
	onRetry?: () => void;
	isPaid?: boolean;
	onUnlockRequest?: () => void;
}

const ImageGenerationProgress: React.FC<ImageGenerationProgressProps> = ({ 
	generatedCount, 
	totalPanels,
	loadingCount,
	onBackToForm,
	generationTarget,
	characterPhotoUrl,
	selectedPhotoForStory,
	isCartoonSelectedForStory,
	error = false,
	onRetry,
	isPaid = false,
	onUnlockRequest,
}) => {
	// Use the specific generationTarget if provided, otherwise default to totalPanels.
	const panelsToGenerate = generationTarget ?? totalPanels;
	const progress = panelsToGenerate > 0 ? (generatedCount / panelsToGenerate) * 100 : 0;

	// The number of images currently "in progress" should be the loadingCount prop
	// which represents images currently being generated
	const inProgressCount = loadingCount || 0;
	
	// Pending count should be total target minus completed minus in progress
	const pendingCount = Math.max(0, panelsToGenerate - generatedCount - inProgressCount);

	// Debug logging
	console.log('=== IMAGE GENERATION PROGRESS DEBUG ===');
	console.log('generatedCount:', generatedCount);
	console.log('totalPanels:', totalPanels);
	console.log('loadingCount (passed):', loadingCount);
	console.log('generationTarget:', generationTarget);
	console.log('panelsToGenerate:', panelsToGenerate);
	console.log('progress:', progress);
	console.log('inProgressCount:', inProgressCount);
	console.log('pendingCount:', pendingCount);
	console.log('error:', error);


	// Track changes to generated count
	useEffect(() => {
		console.log('🎯 PROGRESS UPDATE: Generated count changed to:', generatedCount, 'Progress:', Math.round(progress) + '%');
	}, [generatedCount, progress]);

	debugger;

	return (
		<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-rose-50 via-amber-50 to-orange-50 flex flex-col items-center justify-center p-4">
			<Card className="max-w-lg w-full shadow-2xl border-2 border-purple-200 bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
				<CardContent className="p-8 space-y-6">
					<div className="flex justify-center">
						{selectedPhotoForStory ? (
							<div className="relative">
								<img 
									src={selectedPhotoForStory} 
									alt="Generating illustrations for this character"
									className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg animate-pulse"
								/>
								<div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-3 shadow-lg">
									<Sparkles className="w-6 h-6 text-white animate-spin" />
								</div>
								{/* Show indicator if cartoon is being used */}
								{isCartoonSelectedForStory && (
									<div className="absolute -bottom-2 -left-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-3 py-1 shadow-lg">
										<span className="text-white text-xs font-bold">🎨 Cartoon Style</span>
									</div>
								)}
							</div>
						) : characterPhotoUrl ? (
							<div className="relative">
								<img 
									src={characterPhotoUrl} 
									alt="Generating illustrations for this character"
									className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg animate-pulse"
								/>
								<div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-3 shadow-lg">
									<Sparkles className="w-6 h-6 text-white animate-spin" />
								</div>
							</div>
						) : (
							<div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
								<Sparkles className="w-20 h-20 text-white animate-spin" />
							</div>
						)}
					</div>
					
					<div className="text-center space-y-3">
						<h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
							{error ? '🚨 Generation Failed' : '✨ Creating Magic...'}
						</h2>
						<p className="text-gray-700 text-lg">
							{error 
								? 'Oops! Something went wrong while creating your amazing illustrations.' 
								: `Bringing your story to life: ${generatedCount} of ${panelsToGenerate} images created`
							}
						</p>
						{!error && inProgressCount > 0 && (
							<p className="text-purple-600 font-medium">
								🎨 {inProgressCount} illustrations currently in progress...
							</p>
						)}
					</div>
					
					
					<button 
						className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
						onClick={() => {
							// mark that this flow was initiated from the email button
							localStorage.setItem('emailflow', '1');
							if (!isPaid) {
								onUnlockRequest?.();
								return;
							}
							// Paid users: TODO - implement email delivery trigger here
						}}
					>
						Taking Time ? Send me on Email
					</button>

					<div className="w-full space-y-4">
						{!error && (
							<div className="space-y-3">
								<div className="relative">
									<Progress 
										value={progress} 
										className="w-full h-8 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-200 rounded-full overflow-hidden" 
									/>
									<div className="absolute inset-0 flex items-center justify-center">
										<span className="text-xs font-bold text-purple-700 drop-shadow-sm">
											{Math.round(progress)}%
										</span>
									</div>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-green-600 font-medium">✅ {generatedCount} Complete</span>
									<span className="text-blue-600 font-medium">⏳ {inProgressCount} In Progress</span>
									<span className="text-gray-500 font-medium">📝 {pendingCount} Pending</span>
								</div>
							</div>
						)}
						
						{error && onRetry && (
							<Button 
								onClick={onRetry} 
								className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
							>
								<RotateCcw className="w-5 h-5 mr-2" />
								🔄 Try Again
							</Button>
						)}

						{onBackToForm && (
							<Button 
								onClick={onBackToForm} 
								variant="outline" 
								className="w-full border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold py-3 text-lg rounded-xl shadow-md transform hover:scale-105 transition-all duration-200"
							>
								<ChevronLeft className="w-5 h-5 mr-2" />
								← Back to Story Form
							</Button>
						)}
					</div>

					{!error && (
						<div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
							<p className="text-sm text-blue-700 font-medium">
								🎭 Your personalized storybook is being crafted with love! 
								<br />
								<span className="text-xs text-gray-600 mt-1 block">
									Each illustration is uniquely created for your character ✨
								</span>
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default ImageGenerationProgress;
