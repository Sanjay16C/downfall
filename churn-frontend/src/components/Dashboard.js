import React, { useState, useEffect } from 'react';
import { PulseLoader } from 'react-spinners';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, Legend as BarLegend,
  RadialBarChart, RadialBar, Legend as RadialLegend,
  LineChart, Line, ResponsiveContainer as LineResponsiveContainer
} from 'recharts';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const Dashboard = ({ profileUrl }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [churnRisk, setChurnRisk] = useState(null);
  const [churnBreakdown, setChurnBreakdown] = useState({});
  const [heatmap, setHeatmap] = useState({});
  const [timeOfDayData, setTimeOfDayData] = useState([]);
  const [engagementRatio, setEngagementRatio] = useState(null);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    const fetchUserData = async (username) => {
      try {
        const userResponse = await fetch(`https://www.reddit.com/user/${username}/about.json`);
        const postsResponse = await fetch(`https://www.reddit.com/user/${username}/submitted.json?limit=100`);
        const commentsResponse = await fetch(`https://www.reddit.com/user/${username}/comments.json?limit=100`);

        const userData = await userResponse.json();
        const postsData = await postsResponse.json();
        const commentsData = await commentsResponse.json();

        if (userData && userData.data) {
          const { name, total_karma, created_utc } = userData.data;
          const accountAge = calculateAccountAge(created_utc);

          const postEngagement = postsData.data.children.length;
          const commentEngagement = commentsData.data.children.length;
          const activityTrends = calculateActivityTrends(postsData, commentsData);
          const { heatmapData, timeOfDay } = extractTimeData(postsData, commentsData);

          const subredditCounts = {};
          postsData.data.children.forEach(post => {
            const subreddit = post.data.subreddit;
            subredditCounts[subreddit] = (subredditCounts[subreddit] || 0) + 1;
          });

          const pieChartData = Object.entries(subredditCounts).map(([subreddit, count]) => ({
            name: subreddit,
            value: count,
          }));

          const barChartData = [
            { name: 'Posts', value: postEngagement },
            { name: 'Comments', value: commentEngagement }
          ];

          const { score, breakdown } = calculateChurnRisk(postEngagement, commentEngagement, total_karma, activityTrends);
          const ratio = ((postEngagement + commentEngagement) / (total_karma || 1)).toFixed(2);

          setUserData({
            user_info: { username: name, karma: total_karma, account_age: accountAge },
            post_engagement: postEngagement,
            comment_engagement: commentEngagement,
            subreddit_data: pieChartData || [],
            engagement_data: barChartData,
            activity_trends: activityTrends,
          });

          setChurnRisk(score);
          setChurnBreakdown(breakdown);
          setHeatmap(heatmapData);
          setTimeOfDayData(timeOfDay);
          setEngagementRatio(ratio);
          setInsights(generateInsights(score, ratio, activityTrends));
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setUserData(null);
        setIsLoading(false);
      }
    };

    if (profileUrl) {
      const username = profileUrl.split('/user/')[1];
      fetchUserData(username);
    } else {
      setIsLoading(false);
    }
  }, [profileUrl]);

  const calculateAccountAge = (createdUtc) => {
    const createdDate = new Date(createdUtc * 1000);
    const now = new Date();
    return `${now.getFullYear() - createdDate.getFullYear()} years`;
  };

  const calculateActivityTrends = (postsData, commentsData) => {
    const now = new Date();
    const postDates = postsData.data.children.map(post => new Date(post.data.created_utc * 1000));
    const commentDates = commentsData.data.children.map(comment => new Date(comment.data.created_utc * 1000));

    const count = (days) => {
      const threshold = new Date(now.getTime() - days * 86400000);
      return postDates.filter(d => d > threshold).length + commentDates.filter(d => d > threshold).length;
    };

    return {
      activity30Days: count(30),
      activity60Days: count(60),
      activity90Days: count(90)
    };
  };

  const extractTimeData = (postsData, commentsData) => {
    const all = [...postsData.data.children, ...commentsData.data.children];
    const heatmapData = {};
    const hourCounts = Array(24).fill(0);

    all.forEach(item => {
      const date = new Date(item.data.created_utc * 1000);
      const day = date.getDay();
      const hour = date.getHours();
      heatmapData[`${day}-${hour}`] = (heatmapData[`${day}-${hour}`] || 0) + 1;
      hourCounts[hour]++;
    });

    const timeOfDay = hourCounts.map((count, hour) => ({
      name: `${hour}:00`,
      value: count,
    }));

    return { heatmapData, timeOfDay };
  };

  const calculateChurnRisk = (posts, comments, karma, trends) => {
    const { activity30Days, activity60Days, activity90Days } = trends;
    const recency = activity30Days > 0 ? 0.4 : 1;
    const trendDrop = activity60Days > activity90Days ? 1 : 1.5;

    const score = posts * 0.3 + comments * 0.2 + karma * 0.2 + activity30Days * 0.3;
    const churnScore = score * trendDrop * recency;

    const breakdown = {
      posts: posts * 0.3,
      comments: comments * 0.2,
      karma: karma * 0.2,
      activity: activity30Days * 0.3,
      trendFactor: trendDrop,
      recencyFactor: recency
    };

    let risk;
    if (churnScore < 1500) risk = 80;
    else if (churnScore < 4000) risk = 50;
    else risk = 20;

    return { score: risk, breakdown };
  };

  const generateInsights = (risk, ratio, trends) => {
    const insights = [];
    if (risk > 70) insights.push("⚠️ High churn risk — increase activity to retain visibility.");
    if (ratio < 0.05) insights.push("📉 Low engagement ratio — try participating more in discussions.");
    if (trends.activity30Days < 3) insights.push("⏱️ Very low recent activity — aim for weekly consistency.");
    if (trends.activity60Days > trends.activity30Days) insights.push("📊 Declining trend — re-engage to bounce back.");
    return insights.length ? insights : ["✅ You're on a healthy Reddit usage trend!"];
  };

  if (isLoading) return <Loading />;
  if (!userData) return <EmptyState />;

  const { user_info, post_engagement, comment_engagement, subreddit_data, engagement_data, activity_trends } = userData;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFE', '#FF6699'];

  return (
    <div className="max-w-5xl mx-auto my-12 p-6 md:p-10 rounded-2xl shadow-xl bg-zinc-900 text-zinc-100 font-sans">
      <h2 className="text-3xl font-bold text-center mb-10">🚀 Reddit User Dashboard</h2>

      <Section title="👤 User Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(user_info).map(([key, value]) => <InfoCard key={key} title={key} value={value} />)}
        </div>
      </Section>

      <Section title="📊 Engagement Statistics">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard title="Post Engagement" value={post_engagement} />
          <InfoCard title="Comment Engagement" value={comment_engagement} />
          <InfoCard title="Engagement Ratio" value={engagementRatio} />
        </div>
      </Section>

      <Section title="⚠️ User Churn Risk">
        <div className="text-center mb-4 text-lg text-zinc-300">
          Risk Score: <strong className="text-white">{churnRisk}%</strong> — {churnRisk > 70 ? "High Risk" : churnRisk > 40 ? "Medium Risk" : "Low Risk"}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={[{ name: 'Churn Risk', value: churnRisk }]}>
            <RadialBar minAngle={15} label={{ fill: '#fff' }} background clockWise dataKey="value" />
            <RadialLegend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
          </RadialBarChart>
        </ResponsiveContainer>

        <h4 className="text-xl mt-6 mb-2 text-zinc-400 text-center">🔍 Breakdown</h4>
        <ul className="text-sm text-zinc-300 space-y-1 text-center">
          {Object.entries(churnBreakdown).map(([k, v]) => (
            <li key={k}>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}: <span className="text-white font-semibold">{v.toFixed(1)}</span></li>
          ))}
        </ul>
      </Section>

      <Section title="🧠 Insights">
        <ul className="text-zinc-300 list-disc list-inside space-y-2">
          {insights.map((text, i) => <li key={i}>{text}</li>)}
        </ul>
      </Section>

      <Section title="📌 Subreddit Activity">
        {subreddit_data.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={subreddit_data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {subreddit_data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        ) : <p className="text-center text-zinc-400">Not enough data to display a chart.</p>}
      </Section>

      <Section title="📊 Engagement Overview">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={engagement_data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" fill="#8884d8" />
            <BarTooltip />
            <BarLegend />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section title="📈 Activity Trends (Last 90 Days)">
        <LineResponsiveContainer width="100%" height={300}>
          <LineChart data={[
            { name: '30 Days', activity: activity_trends.activity30Days },
            { name: '60 Days', activity: activity_trends.activity60Days },
            { name: '90 Days', activity: activity_trends.activity90Days },
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="activity" stroke="#82ca9d" />
          </LineChart>
        </LineResponsiveContainer>
      </Section>

      <Section title="🕒 Time of Day Analysis">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeOfDayData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" fill="#00C49F" />
            <Tooltip />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
};

const InfoCard = ({ title, value }) => (
  <div className="p-6 bg-zinc-800 border border-zinc-700 rounded-xl text-center">
    <h4 className="text-sm font-medium text-zinc-400 mb-1">{title.toUpperCase()}</h4>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const Section = ({ title, children }) => (
  <div className="mb-12 p-6 border border-zinc-700 rounded-xl bg-zinc-800/50 backdrop-blur-sm">
    <h3 className="text-2xl font-semibold mb-6 text-center">{title}</h3>
    {children}
  </div>
);

const Loading = () => (
  <div className="flex justify-center items-center my-12" aria-live="polite">
    <PulseLoader color="#007bff" size={15} />
    <span className="ml-4 text-lg text-zinc-400">Loading...</span>
  </div>
);

const EmptyState = () => (
  <div className="text-center my-12">
    <span className="text-2xl text-zinc-400">No data available.</span>
  </div>
);

export default Dashboard;