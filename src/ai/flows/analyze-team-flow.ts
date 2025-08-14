/**
 * @fileOverview An AI agent that analyzes a user's team structure and performance.
 *
 * - analyzeTeam - A function that handles the team analysis process.
 * - AnalyzeTeamInput - The input type for the analyzeTeam function.
 * - AnalyzeTeamOutput - The return type for the analyzeTeam function.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { User, Level } from '@/lib/types'; // Assuming types are available
import { getDoc, doc, collection, getDocs, where, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';


// Define Zod Schemas for input and output
export const AnalyzeTeamInputSchema = z.object({
  userId: z.string().describe("The ID of the user whose team is to be analyzed."),
});
export type AnalyzeTeamInput = z.infer<typeof AnalyzeTeamInputSchema>;

export const AnalyzeTeamOutputSchema = z.object({
  strengths: z.array(z.string()).describe("Positive aspects of the user's team-building efforts."),
  weaknesses: z.array(z.string()).describe("Areas where the user's team-building could be improved."),
  suggestions: z.array(z.string()).describe("Actionable suggestions for the user to improve team performance and engagement."),
  rewardAnalysis: z.string().describe("An analysis of the user's proximity to earning team-based rewards."),
});
export type AnalyzeTeamOutput = z.infer<typeof AnalyzeTeamOutputSchema>;


// Helper function to fetch the entire downline for a user
async function getDownline(userId: string): Promise<{ level1: User[], level2: User[], level3: User[] }> {
    const downline = { level1: [] as User[], level2: [] as User[], level3: [] as User[] };

    const usersRef = collection(db, "users");
    
    // Level 1
    const l1Query = query(usersRef, where("referredBy", "==", userId));
    const l1Snap = await getDocs(l1Query);
    downline.level1 = l1Snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

    if (downline.level1.length === 0) return downline;

    // Level 2
    const l1Ids = downline.level1.map(u => u.id);
    // Firestore 'in' query is limited to 30 items. For larger teams, this needs pagination.
    const l2Query = query(usersRef, where("referredBy", "in", l1Ids.slice(0,30)));
    const l2Snap = await getDocs(l2Query);
    downline.level2 = l2Snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

    if (downline.level2.length === 0) return downline;

    // Level 3
    const l2Ids = downline.level2.map(u => u.id);
    const l3Query = query(usersRef, where("referredBy", "in", l2Ids.slice(0,30)));
    const l3Snap = await getDocs(l3Query);
    downline.level3 = l3Snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

    return downline;
}

// Define the Genkit Flow
const analyzeTeamFlow = ai.defineFlow(
  {
    name: 'analyzeTeamFlow',
    inputSchema: AnalyzeTeamInputSchema,
    outputSchema: AnalyzeTeamOutputSchema,
  },
  async (input) => {
    const userRef = doc(db, "users", input.userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User not found");
    }
    const user = userSnap.data() as User;
    const downline = await getDownline(input.userId);

    const prompt = `You are a professional team-building analyst for a staking platform.
    Your task is to analyze a user's downline team structure and provide actionable insights.
    
    User to analyze: ${user.email} (Level ${user.level})
    
    Team Structure:
    - Level 1 (Direct Referrals): ${downline.level1.length} members.
    - Level 2: ${downline.level2.length} members.
    - Level 3: ${downline.level3.length} members.

    Team Details (sample of direct referrals):
    ${downline.level1.slice(0, 5).map(u => `- ${u.email}: Level ${u.level}, Balance ${u.balance.toFixed(2)} USDT, Has referrals: ${(u.referredUsers || []).length > 0}`).join('\n')}

    Based on this data, provide a concise analysis in the requested JSON format.
    - Strengths: Identify what the user is doing well (e.g., good number of direct referrals).
    - Weaknesses: Identify potential issues (e.g., direct referrals are not building their own teams, indicating a lack of training or motivation).
    - Suggestions: Give concrete advice. For example: "Encourage direct referrals to use their own referral codes," or "Focus on helping new members make their first deposit to activate them."
    - Reward Analysis: Comment on their progress towards team-based rewards.
    
    Focus on providing helpful, encouraging, and clear feedback.`;

    const { output } = await ai.generate({
        prompt,
        model: 'googleai/gemini-2.0-flash',
        output: { schema: AnalyzeTeamOutputSchema },
    });
    
    return output!;
  }
);


// Exported wrapper function
export async function analyzeTeam(input: AnalyzeTeamInput): Promise<AnalyzeTeamOutput> {
  return analyzeTeamFlow(input);
}
