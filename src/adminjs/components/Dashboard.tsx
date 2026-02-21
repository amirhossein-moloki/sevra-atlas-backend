import React from 'react';
import { Box, H2, Text, Illustration, H5, Badge } from '@adminjs/design-system';
import { ApiClient, useTranslation } from 'adminjs';

const Dashboard: React.FC = () => {
  const { translateMessage } = useTranslation();
  const [data, setData] = React.useState<any>(null);
  const api = new ApiClient();

  React.useEffect(() => {
    api.getDashboard().then((response) => {
      setData(response.data);
    });
  }, []);

  if (!data) return <Box>Loading...</Box>;

  return (
    <Box>
      <Box variant="grey" p="xl" mb="xl" style={{ borderRadius: '8px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <H2>Enterprise Overview</H2>
        <Text>Welcome to Sevra Atlas Administration Panel. Here is your system status at a glance.</Text>
      </Box>

      <Box display="flex" flexDirection="row" flexWrap="wrap" justifyContent="space-between">
        <Box width={[1, 1/2, 1/4]} p="md">
           <Box variant="white" p="lg" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <H5>Total Users</H5>
              <H2 color="primary100">{data.metrics.users}</H2>
           </Box>
        </Box>
        <Box width={[1, 1/2, 1/4]} p="md">
           <Box variant="white" p="lg" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <H5>Active Salons</H5>
              <H2 color="primary100">{data.metrics.salons}</H2>
           </Box>
        </Box>
        <Box width={[1, 1/2, 1/4]} p="md">
           <Box variant="white" p="lg" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <H5>Total Revenue</H5>
              <H2 color="success">{data.metrics.revenue.toLocaleString()} IRR</H2>
           </Box>
        </Box>
        <Box width={[1, 1/2, 1/4]} p="md">
           <Box variant="white" p="lg" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <H5>Pending Verifications</H5>
              <H2 color="error">{data.metrics.pendingVerifications}</H2>
           </Box>
        </Box>
      </Box>

      <Box mt="xl" display="flex" flexDirection={['column', 'row']}>
        <Box flexGrow={1} mr={[0, 'lg']} mb={['lg', 0]}>
          <Box variant="white" p="lg" style={{ borderRadius: '8px' }}>
            <H5 mb="lg">Recent Payments</H5>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>User</th>
                  <th style={{ padding: '8px' }}>Amount</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '8px' }}>{p.user}</td>
                    <td style={{ padding: '8px' }}>{p.amount.toLocaleString()}</td>
                    <td style={{ padding: '8px' }}>
                      <Badge variant={p.status === 'VERIFIED' ? 'success' : 'default'}>{p.status}</Badge>
                    </td>
                    <td style={{ padding: '8px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
        <Box width={[1, '300px']}>
           <Box variant="white" p="lg" style={{ borderRadius: '8px', textAlign: 'center' }}>
              <Illustration variant="Rocket" />
              <H5 mt="lg">System Status</H5>
              <Text mt="md" color="success">All systems operational</Text>
           </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
