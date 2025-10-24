import { useState, useEffect } from 'react';

/**
 * Hook to fetch user profile from Ethereum Follow Protocol API
 * @param {string} address - Ethereum address
 * @returns {Object} EFP profile data
 */
export const useEFPProfile = (address) => {
  const [efpData, setEfpData] = useState({
    list: null,
    avatar: null,
    header: null,
    name: null,
    bio: null,
    location: null,
    url: null,
    socials: {},
    links: [],
    records: {},
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchEFPData = async () => {
      if (!address) {
        setEfpData(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        setEfpData(prev => ({ ...prev, isLoading: true, error: null }));

        // Fetch user details (includes ENS data and profile info)
        const detailsResponse = await fetch(
          `https://api.ethfollow.xyz/api/v1/users/${address}/details`
        );
        
        if (!detailsResponse.ok) {
          throw new Error('Failed to fetch EFP user details');
        }

        const data = await detailsResponse.json();
        
        if (!mounted) return;

        // Extract ENS records
        const ensRecords = data.ens?.records || {};
        
        // Extract profile data from the response
        const profileData = {
          list: data.primary_list || null,
          avatar: data.ens?.avatar || ensRecords.avatar || null,
          header: ensRecords.header || ensRecords['header.image'] || null,
          name: data.ens?.name || ensRecords.name || null,
          bio: ensRecords.description || ensRecords.bio || null,
          location: ensRecords.location || null,
          url: ensRecords.url || ensRecords.website || null,
          socials: {},
          links: [],
          records: ensRecords,
          isLoading: false,
          error: null,
        };

        // Parse social links from ENS records
        const socialPlatforms = ['twitter', 'github', 'telegram', 'discord', 'lens', 'farcaster'];
        socialPlatforms.forEach(platform => {
          // Check for 'com.platform' format (EFP standard)
          if (ensRecords[`com.${platform}`]) {
            profileData.socials[platform] = ensRecords[`com.${platform}`];
          }
          // Also check plain platform name
          else if (ensRecords[platform]) {
            profileData.socials[platform] = ensRecords[platform];
          }
        });

        // Extract custom links
        Object.keys(ensRecords).forEach(key => {
          if (key.startsWith('link.') || key.startsWith('url.')) {
            profileData.links.push({
              label: key.replace('link.', '').replace('url.', '').replace(/[._-]/g, ' '),
              url: ensRecords[key]
            });
          }
        });

        setEfpData(profileData);
      } catch (error) {
        console.error('EFP API error:', error);
        if (!mounted) return;
        
        setEfpData({
          list: null,
          avatar: null,
          header: null,
          name: null,
          bio: null,
          location: null,
          url: null,
          socials: {},
          links: [],
          records: {},
          isLoading: false,
          error: error.message,
        });
      }
    };

    fetchEFPData();

    return () => {
      mounted = false;
    };
  }, [address]);

  return efpData;
};
