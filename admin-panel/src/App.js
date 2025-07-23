import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, CssBaseline, Box, Container, ThemeProvider, createTheme, Avatar, Divider, IconButton, InputBase, Paper, Button, Stack, Badge, CircularProgress } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SearchIcon from '@mui/icons-material/Search';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PersonIcon from '@mui/icons-material/Person';
import BuildIcon from '@mui/icons-material/Build';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import { db, auth } from './firebase';
import { collection, getCountFromServer, query, where, getDocs, orderBy, limit, Timestamp, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const drawerWidth = 220;

const theme = createTheme({
  palette: {
    primary: { main: '#1B365D' },
    secondary: { main: '#D4AF37' },
    background: { default: '#f5f7fa', paper: '#fff' },
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#1B365D',
          color: '#fff',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#fff',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#fff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          background: '#fff',
          color: '#1B365D',
          boxShadow: '0 2px 8px rgba(27,54,93,0.04)',
        },
      },
    },
  },
});

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Events', icon: <EventIcon />, path: '/events' },
  { text: 'Requests', icon: <AssignmentIcon />, path: '/requests' },
  { text: 'Announcements', icon: <CampaignIcon />, path: '/announcements' },
  { text: 'Members', icon: <PeopleIcon />, path: '/members' },
];

function DashboardPage() {
  const [openIssues, setOpenIssues] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState(null);
  const [members, setMembers] = useState(null);
  const [recent, setRecent] = useState([]);
  const [recentResolved, setRecentResolved] = useState([]);
  const [recentEndedEvents, setRecentEndedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingResolved, setLoadingResolved] = useState(true);
  const [loadingEndedEvents, setLoadingEndedEvents] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    // Open Issues
    const unsubOpen = onSnapshot(query(collection(db, 'requests'), where('status', '==', 'Pending')), snap => {
      setOpenIssues(snap.size);
    });
    // Upcoming Events
    const today = new Date();
    today.setHours(0,0,0,0);
    const unsubEvents = onSnapshot(query(collection(db, 'events'), where('date', '>=', today.toISOString().slice(0,10))), snap => {
      setUpcomingEvents(snap.size);
    });
    // Members
    const unsubMembers = onSnapshot(collection(db, 'members'), snap => {
      setMembers(snap.size);
    });
    // Recent Activity
    const unsubReq = onSnapshot(query(collection(db, 'requests'), orderBy('date', 'desc'), limit(3)), reqSnap => {
      const reqArr = reqSnap.docs.map(doc => ({ ...doc.data(), type: 'request' }));
      setRecent(prev => {
        const prevMem = prev.filter(x => x.type === 'member');
        const prevAnn = prev.filter(x => x.type === 'announcement');
        return [...reqArr, ...prevMem, ...prevAnn].sort((a, b) => {
          const dateA = a.date ? new Date(a.date) : new Date(a.createdAt);
          const dateB = b.date ? new Date(b.date) : new Date(b.createdAt);
          return dateB - dateA;
        }).slice(0, 3);
      });
    });
    const unsubMem = onSnapshot(query(collection(db, 'members'), orderBy('createdAt', 'desc'), limit(3)), memSnap => {
      const memArr = memSnap.docs.map(doc => ({ ...doc.data(), type: 'member' }));
      setRecent(prev => {
        const prevReq = prev.filter(x => x.type === 'request');
        const prevAnn = prev.filter(x => x.type === 'announcement');
        return [...prevReq, ...memArr, ...prevAnn].sort((a, b) => {
          const dateA = a.date ? new Date(a.date) : new Date(a.createdAt);
          const dateB = b.date ? new Date(b.date) : new Date(b.createdAt);
          return dateB - dateA;
        }).slice(0, 3);
      });
    });
    const unsubAnn = onSnapshot(query(collection(db, 'announcements'), orderBy('date', 'desc'), limit(3)), annSnap => {
      const annArr = annSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'announcement' }));
      setRecent(prev => {
        const prevReq = prev.filter(x => x.type === 'request');
        const prevMem = prev.filter(x => x.type === 'member');
        return [...prevReq, ...prevMem, ...annArr].sort((a, b) => {
          const dateA = a.date ? new Date(a.date) : new Date(a.createdAt);
          const dateB = b.date ? new Date(b.date) : new Date(b.createdAt);
          return dateB - dateA;
        }).slice(0, 3);
      });
      setLoading(false);
    });
    return () => {
      unsubOpen();
      unsubEvents();
      unsubMembers();
      unsubReq();
      unsubMem();
      unsubAnn();
    };
  }, []);

  useEffect(() => {
    setLoadingResolved(true);
    const unsub = onSnapshot(
      query(collection(db, 'requests'), where('status', '==', 'Resolved'), orderBy('date', 'desc'), limit(3)),
      snap => {
        setRecentResolved(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingResolved(false);
      },
      error => {
        setRecentResolved([]);
        setLoadingResolved(false);
        console.error('Resolved issues snapshot error:', error);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoadingEndedEvents(true);
    const today = new Date();
    today.setHours(0,0,0,0);
    const unsub = onSnapshot(
      query(collection(db, 'events'), where('date', '<', today.toISOString().slice(0,10)), orderBy('date', 'desc'), limit(3)),
      snap => {
        setRecentEndedEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingEndedEvents(false);
      }
    );
    return () => unsub();
  }, []);

  return (
    <Box sx={{ p: 0 }}>
      <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>Dashboard Overview</Typography>
      <Stack direction="row" spacing={3} mb={4}>
        <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 3, boxShadow: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: '#eaf1fb', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
            <BuildIcon sx={{ color: '#1B365D', fontSize: 28 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Open Issues</Typography>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>{openIssues === null ? <CircularProgress size={22} /> : openIssues} <span style={{ fontWeight: 400, fontSize: 16, color: '#888' }}>Issues</span></Typography>
            <Button size="small" endIcon={<span style={{ fontSize: 18 }}>&#8594;</span>} sx={{ mt: 1, color: '#1B365D', fontWeight: 600, textTransform: 'none' }} onClick={() => navigate('/requests?status=Pending')}>View Details</Button>
          </Box>
        </Paper>
        <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 3, boxShadow: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: '#fff7e6', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
            <CalendarMonthIcon sx={{ color: '#D4AF37', fontSize: 28 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Upcoming Events</Typography>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>{upcomingEvents === null ? <CircularProgress size={22} /> : upcomingEvents} <span style={{ fontWeight: 400, fontSize: 16, color: '#888' }}>Events</span></Typography>
            <Button size="small" endIcon={<span style={{ fontSize: 18 }}>&#8594;</span>} sx={{ mt: 1, color: '#D4AF37', fontWeight: 600, textTransform: 'none' }} onClick={() => navigate('/events?upcoming=true')}>View Details</Button>
          </Box>
        </Paper>
        <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 3, boxShadow: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: '#eaf1fb', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
            <GroupIcon sx={{ color: '#1B365D', fontSize: 28 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Members</Typography>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>{members === null ? <CircularProgress size={22} /> : members} <span style={{ fontWeight: 400, fontSize: 16, color: '#888' }}>Registered</span></Typography>
            <Button size="small" endIcon={<span style={{ fontSize: 18 }}>&#8594;</span>} sx={{ mt: 1, color: '#1B365D', fontWeight: 600, textTransform: 'none' }} onClick={() => navigate('/members')}>View Members</Button>
          </Box>
        </Paper>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} mb={4}>
        <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
            Recent Resolved Issues
          </Typography>
          {loadingResolved ? <CircularProgress /> : recentResolved.length === 0 ? <Typography color="text.secondary">No resolved issues.</Typography> : (
            <Stack spacing={1}>
              {recentResolved.map(issue => (
                <Box key={issue.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AssignmentIcon sx={{ color: '#4CAF50' }} />
                  <Typography sx={{ flex: 1 }}>{issue.title || 'Untitled'}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 13 }}>{issue.date || ''}</Typography>
                  <span style={{ color: '#4CAF50', fontSize: 18, marginLeft: 4 }}>&#10003;</span>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
        <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
            Recent Ended Events
          </Typography>
          {loadingEndedEvents ? <CircularProgress /> : recentEndedEvents.length === 0 ? <Typography color="text.secondary">No ended events.</Typography> : (
            <Stack spacing={1}>
              {recentEndedEvents.map(ev => (
                <Box key={ev.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarMonthIcon sx={{ color: '#888' }} />
                  <Typography sx={{ flex: 1 }}>{ev.title || 'Untitled'}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 13 }}>{ev.date || ''}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
        <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
            Recent Announcements
          </Typography>
          {loading ? <CircularProgress /> : (() => {
            const recentAnnouncements = recent.filter(x => x.type === 'announcement').slice(0, 3);
            return recentAnnouncements.length === 0 ? <Typography color="text.secondary">No announcements.</Typography> : (
              <Stack spacing={1}>
                {recentAnnouncements.map(ann => (
                  <Box key={ann.id || ann.title} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <VolumeUpIcon sx={{ color: '#D4AF37' }} />
                    <Typography sx={{ flex: 1 }}>{ann.title || 'Untitled'}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 13 }}>{ann.date || ''}</Typography>
                  </Box>
                ))}
              </Stack>
            );
          })()}
        </Paper>
      </Stack>
      <Paper elevation={0} sx={{ borderRadius: 3, boxShadow: 1, p: 3 }}>
        <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 700 }}>Recent Activity</Typography>
        <Stack spacing={2}>
          {loading ? <CircularProgress size={28} sx={{ mx: 'auto', my: 2 }} /> : recent.length === 0 ? <Typography color="text.secondary">No recent activity yet.</Typography> : recent.map((item, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {item.type === 'request' && <MailOutlineIcon sx={{ color: '#1B365D', bgcolor: '#eaf1fb', borderRadius: '50%', p: 0.7, fontSize: 28 }} />}
              {item.type === 'member' && <GroupAddIcon sx={{ color: '#1B365D', bgcolor: '#eaf1fb', borderRadius: '50%', p: 0.7, fontSize: 28 }} />}
              {item.type === 'announcement' && <VolumeUpIcon sx={{ color: '#D4AF37', bgcolor: '#fff7e6', borderRadius: '50%', p: 0.7, fontSize: 28 }} />}
              <Typography sx={{ flex: 1 }}>
                {item.type === 'request' && `${item.title || 'New request submitted'}`}
                {item.type === 'member' && `${item.firstName || 'New'} ${item.lastName || 'member'} joined`}
                {item.type === 'announcement' && `Announcement "${item.title || ''}" posted`}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                {item.date ? timeAgo(item.date) : item.createdAt ? timeAgo(item.createdAt) : ''}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return 'Yesterday';
  return date.toLocaleDateString();
}

function EventsPage() {
  const [searchParams] = useSearchParams();
  const showUpcoming = searchParams.get('upcoming') === 'true';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    setLoading(true);
    let q = collection(db, 'events');
    if (showUpcoming) {
      q = query(q, where('status', '==', 'Upcoming'));
    }
    else if (searchParams.get('ended') === 'true') {
      q = query(q, where('status', '==', 'Ended'));
    }
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [showUpcoming, searchParams]);

  const handleToggleStatus = async (id, currentStatus) => {
    setActionLoading(l => ({ ...l, [id]: true }));
    try {
      const newStatus = currentStatus === 'Upcoming' ? 'Ended' : 'Upcoming';
      await updateDoc(doc(db, 'events', id), { status: newStatus });
    } finally {
      setActionLoading(l => ({ ...l, [id]: false }));
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(l => ({ ...l, [id]: true }));
    try {
      await deleteDoc(doc(db, 'events', id));
    } finally {
      setActionLoading(l => ({ ...l, [id]: false }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" color="primary" gutterBottom>Events Management</Typography>
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3, boxShadow: 1 }}>
        {loading ? <CircularProgress /> : events.length === 0 ? <Typography color="text.secondary">No events found.</Typography> : (
          <Stack spacing={2}>
            {events.map(ev => (
              <Paper key={ev.id} sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon sx={{ color: '#D4AF37' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{ev.title || 'Untitled Event'}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 14 }}>{ev.description || ''}</Typography>
                  <Typography color="secondary" sx={{ fontSize: 13, mt: 0.5 }}>Date: {ev.date}</Typography>
                  <Typography color="secondary" sx={{ fontSize: 13, mt: 0.5 }}>Status: {ev.status || 'Upcoming'}</Typography>
                  {ev.priority && (
                    <Typography color="secondary" sx={{ fontSize: 13, mt: 0.5 }}>Priority: {ev.priority}</Typography>
                  )}
                </Box>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>{ev.time || ''}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color={ev.status === 'Upcoming' ? 'success' : 'warning'}
                    disabled={!!actionLoading[ev.id]}
                    onClick={() => handleToggleStatus(ev.id, ev.status)}
                  >
                    {actionLoading[ev.id] ? <CircularProgress size={18} /> : ev.status === 'Upcoming' ? 'Mark as Ended' : 'Mark as Upcoming'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={!!actionLoading[ev.id]}
                    onClick={() => handleDelete(ev.id)}
                  >
                    {actionLoading[ev.id] ? <CircularProgress size={18} /> : 'Delete'}
                  </Button>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
function RequestsPage() {
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    setLoading(true);
    let q = collection(db, 'requests');
    if (statusFilter) {
      q = query(q, where('status', '==', statusFilter));
    }
    const unsub = onSnapshot(q, snap => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [statusFilter]);

  const handleToggleStatus = async (id, currentStatus) => {
    setActionLoading(l => ({ ...l, [id]: true }));
    try {
      const newStatus = currentStatus === 'Pending' ? 'Resolved' : 'Pending';
      await updateDoc(doc(db, 'requests', id), { status: newStatus });
    } finally {
      setActionLoading(l => ({ ...l, [id]: false }));
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(l => ({ ...l, [id]: true }));
    try {
      await deleteDoc(doc(db, 'requests', id));
    } finally {
      setActionLoading(l => ({ ...l, [id]: false }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" color="primary" gutterBottom>Requests Management</Typography>
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3, boxShadow: 1 }}>
        {loading ? <CircularProgress /> : requests.length === 0 ? <Typography color="text.secondary">No requests found.</Typography> : (
          <Stack spacing={2}>
            {requests.map(req => (
              <Paper key={req.id} sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssignmentIcon sx={{ color: '#1B365D' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{req.title || 'Untitled Request'}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 14 }}>{req.description || ''}</Typography>
                  <Typography color="secondary" sx={{ fontSize: 13, mt: 0.5 }}>Status: {req.status}</Typography>
                </Box>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>{req.date || ''}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color={req.status === 'Pending' ? 'success' : 'warning'}
                    disabled={!!actionLoading[req.id]}
                    onClick={() => handleToggleStatus(req.id, req.status)}
                  >
                    {actionLoading[req.id] ? <CircularProgress size={18} /> : req.status === 'Pending' ? 'Mark as Resolved' : 'Mark as Pending'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={!!actionLoading[req.id]}
                    onClick={() => handleDelete(req.id)}
                  >
                    {actionLoading[req.id] ? <CircularProgress size={18} /> : 'Delete'}
                  </Button>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(query(collection(db, 'announcements'), orderBy('date', 'desc')), snap => {
      setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id) => {
    setActionLoading(l => ({ ...l, [id]: true }));
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } finally {
      setActionLoading(l => ({ ...l, [id]: false }));
    }
  };

  const filtered = announcements.filter(a => filter === 'all' || a.priority === filter);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" color="primary" gutterBottom>Announcements</Typography>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button variant={filter === 'all' ? 'contained' : 'outlined'} color="primary" onClick={() => setFilter('all')}>All</Button>
        <Button variant={filter === 'high' ? 'contained' : 'outlined'} color="error" onClick={() => setFilter('high')}>High</Button>
        <Button variant={filter === 'medium' ? 'contained' : 'outlined'} color="warning" onClick={() => setFilter('medium')}>Medium</Button>
        <Button variant={filter === 'low' ? 'contained' : 'outlined'} color="success" onClick={() => setFilter('low')}>Low</Button>
      </Box>
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3, boxShadow: 1 }}>
        {loading ? <CircularProgress /> : filtered.length === 0 ? <Typography color="text.secondary">No announcements found.</Typography> : (
          <Stack spacing={2}>
            {filtered.map(ann => (
              <Paper key={ann.id} sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <VolumeUpIcon sx={{ color: ann.priority === 'high' ? '#f44336' : ann.priority === 'medium' ? '#ff9800' : ann.priority === 'low' ? '#4caf50' : '#D4AF37' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{ann.title || 'Untitled Announcement'}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 14 }}>{ann.content || ''}</Typography>
                  <Typography color="secondary" sx={{ fontSize: 13, mt: 0.5 }}>Priority: {ann.priority || 'medium'}</Typography>
                  <Typography color="secondary" sx={{ fontSize: 13, mt: 0.5 }}>Date: {ann.date}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      variant={ann.priority === 'high' ? 'contained' : 'outlined'}
                      color="error"
                      disabled={!!actionLoading[ann.id]}
                      onClick={async () => {
                        setActionLoading(l => ({ ...l, [ann.id]: true }));
                        try {
                          await updateDoc(doc(db, 'announcements', ann.id), { priority: 'high' });
                        } finally {
                          setActionLoading(l => ({ ...l, [ann.id]: false }));
                        }
                      }}
                    >
                      {actionLoading[ann.id] && ann.priority !== 'high' ? <CircularProgress size={16} /> : 'High'}
                    </Button>
                    <Button
                      size="small"
                      variant={ann.priority === 'medium' ? 'contained' : 'outlined'}
                      color="warning"
                      disabled={!!actionLoading[ann.id]}
                      onClick={async () => {
                        setActionLoading(l => ({ ...l, [ann.id]: true }));
                        try {
                          await updateDoc(doc(db, 'announcements', ann.id), { priority: 'medium' });
                        } finally {
                          setActionLoading(l => ({ ...l, [ann.id]: false }));
                        }
                      }}
                    >
                      {actionLoading[ann.id] && ann.priority !== 'medium' ? <CircularProgress size={16} /> : 'Medium'}
                    </Button>
                    <Button
                      size="small"
                      variant={ann.priority === 'low' ? 'contained' : 'outlined'}
                      color="success"
                      disabled={!!actionLoading[ann.id]}
                      onClick={async () => {
                        setActionLoading(l => ({ ...l, [ann.id]: true }));
                        try {
                          await updateDoc(doc(db, 'announcements', ann.id), { priority: 'low' });
                        } finally {
                          setActionLoading(l => ({ ...l, [ann.id]: false }));
                        }
                      }}
                    >
                      {actionLoading[ann.id] && ann.priority !== 'low' ? <CircularProgress size={16} /> : 'Low'}
                    </Button>
                  </Box>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  disabled={!!actionLoading[ann.id]}
                  onClick={() => handleDelete(ann.id)}
                >
                  {actionLoading[ann.id] ? <CircularProgress size={18} /> : 'Delete'}
                </Button>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'members'), snap => {
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return (
      (m.firstName && m.firstName.toLowerCase().includes(q)) ||
      (m.lastName && m.lastName.toLowerCase().includes(q)) ||
      (m.homeNumber && m.homeNumber.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" color="primary" gutterBottom>Members Directory</Typography>
      <Box sx={{ mb: 2 }}>
        <Paper component="form" sx={{ p: '2px 8px', display: 'flex', alignItems: 'center', width: 320, borderRadius: 2, boxShadow: 0, bgcolor: '#f5f7fa', border: '1px solid #e0e0e0' }}>
          <IconButton sx={{ p: '6px', color: '#1B365D' }} aria-label="search">
            <SearchIcon />
          </IconButton>
          <InputBase sx={{ ml: 1, flex: 1, fontSize: 15 }} placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
        </Paper>
      </Box>
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3, boxShadow: 1 }}>
        {loading ? <CircularProgress /> : filtered.length === 0 ? <Typography color="text.secondary">No members found.</Typography> : (
          <Stack spacing={2}>
            {filtered.map(mem => (
              <Paper key={mem.id} sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <PeopleIcon sx={{ color: '#1B365D' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{mem.firstName || ''} {mem.lastName || ''}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 14 }}>{mem.email || ''}</Typography>
                  <Typography color="secondary" sx={{ fontSize: 13, mt: 0.5 }}>Home: {mem.homeNumber || ''}</Typography>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

function CustomAppBar() {
  return (
    <AppBar position="fixed" color="primary" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src="/bsna-logo.png" alt="BSNA Logo" style={{ width: 40, height: 40, marginRight: 16, borderRadius: 8, objectFit: 'contain', background: '#fff' }} />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            Blessed Sapphire Admin
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Paper component="form" sx={{ p: '2px 8px', display: 'flex', alignItems: 'center', width: 220, borderRadius: 2, boxShadow: 0, bgcolor: '#f5f7fa', border: '1px solid #e0e0e0' }}>
            <IconButton sx={{ p: '6px', color: '#1B365D' }} aria-label="search">
              <SearchIcon />
            </IconButton>
            <InputBase sx={{ ml: 1, flex: 1, fontSize: 15 }} placeholder="Search" inputProps={{ 'aria-label': 'search' }} />
          </Paper>
          <IconButton sx={{ color: '#1B365D' }}>
            <Badge color="secondary" variant="dot" overlap="circular">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
            <PersonIcon sx={{ color: '#fff' }} />
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function CustomDrawer() {
  const location = useLocation();
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Box sx={{ bgcolor: '#fff', borderRadius: 3, px: 3, py: 3, display: 'inline-block', mb: 1, minWidth: 140 }}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '50%', width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
              <img src="/bsna-logo.png" alt="BSNA Logo" style={{ width: 80, height: 80, borderRadius: '50%', display: 'block', background: 'none', objectFit: 'contain' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ color: '#222', fontWeight: 700, mt: 1 }}>Blessed Sapphire</Typography>
          </Box>
          <Divider sx={{ my: 2, bgcolor: 'secondary.main', opacity: 0.2 }} />
        </Box>
        <List>
          {navItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{ borderRadius: 2, mb: 1, '&.Mui-selected, &:hover': { bgcolor: 'rgba(212,175,55,0.08)', color: '#fff' } }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ textAlign: 'center', pb: 2, color: 'secondary.main', fontSize: 13 }}>
          <Divider sx={{ my: 2, bgcolor: 'secondary.main', opacity: 0.2 }} />
          <span>© {new Date().getFullYear()} Blessed Sapphire HOA</span>
        </Box>
      </Box>
    </Drawer>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <CustomAppBar />
          <CustomDrawer />
          <Box
            component="main"
            sx={{ flexGrow: 1, bgcolor: 'background.default', p: 0, minHeight: '100vh' }}
          >
            <Toolbar />
            <Container maxWidth="lg" sx={{ py: 4 }}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/members" element={<MembersPage />} />
              </Routes>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
