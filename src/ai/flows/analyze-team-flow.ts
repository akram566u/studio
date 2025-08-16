
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
import { User, Level, AnalyzeTeamInputSchema, AnalyzeTeamOutputSchema, AnalyzeTeamInput, AnalyzeTeamOutput } from '@/lib/types';
import { getDoc, doc, collection, getDocs, where, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper function to get counts of each level
async function getDownlineCounts(userId: string): Promise<{ level1: number, level2: number, level3: number }> {
    const counts = { level1: 0, level2: 0, level3: 0 };
    const usersRef = collection(db, "users");

    // Get Level 1 referrals and their IDs
    const l1Query = query(usersRef, where("referredBy", "==", userId));
    const l1Snap = await getDocs(l1Query);
    counts.level1 = l1Snap.size;
    if (l1Snap.empty) return counts;

    // Get Level 2 referrals and their IDs
    const l1Ids = l1Snap.docs.map(doc => doc.id);
    const l2Query = query(usersRef, where("referredBy", "in", l1Ids));
    const l2Snap = await getDocs(l2Query);
    counts.level2 = l2Snap.size;
    if (l2Snap.empty) return counts;
    
    // Get Level 3 referrals
    const l2Ids = l2Snap.docs.map(doc => doc.id);
    const l3Query = query(usersRef, where("referredBy", "in", l2Ids));
    const l3Snap = await getDocs(l3Query);
    counts.level3 = l3Snap.size;

    return counts;
}

// Helper function to get a sample of direct referrals
async function getDirectReferralSample(userId: string, sampleSize: number = 5): Promise<User[]> {
    const usersRef = collection(db, "users");
    const l1Query = query(usersRef, where("referredBy", "==", userId), limit(sampleSize));
    const l1Snap = await getDocs(l1Query);
    return l1Snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

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
    
    // Use the more efficient helper functions
    const downlineCounts = await getDownlineCounts(input.userId);
    const referralSample = await getDirectReferralSample(input.userId);

    const prompt = `You are a professional team-building analyst for a staking platform.
    Your task is to analyze a user's downline team structure based on summary data and provide actionable insights.
    
    User to analyze: ${user.email} (Level ${user.level})
    
    Team Structure (Total Counts):
    - Level 1 (Direct Referrals): ${downlineCounts.level1} members.
    - Level 2: ${downlineCounts.level2} members.
    - Level 3: ${downlineCounts.level3} members.

    Team Details (a sample of up to 5 direct referrals):
    ${referralSample.length > 0 ? referralSample.map(u => `- ${u.email}: Level ${u.level}, Balance ${u.balance.toFixed(2)} USDT, Has referrals: ${(u.referredUsers || []).length > 0}`).join('\n') : 'No direct referrals found.'}

    Based on this data, provide a concise analysis in the requested JSON format.
    - Strengths: Identify what the user is doing well (e.g., good number of direct referrals, active downline).
    - Weaknesses: Identify potential issues (e.g., direct referrals are not building their own teams, indicating a lack of training or motivation, even if the user has many direct referrals).
    - Suggestions: Give concrete advice. For example: "Encourage direct referrals to use their own referral codes," or "Focus on helping new members make their first deposit to activate them."
    - Reward Analysis: Comment on their progress towards team-based rewards.
    
    Focus on providing helpful, encouraging, and clear feedback. The analysis should be insightful even with just the summary counts and a small sample.`;

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
