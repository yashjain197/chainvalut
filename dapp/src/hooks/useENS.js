import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { normalize } from 'viem/ens';

/**
 * Custom hook to fetch comprehensive ENS data for an address
 * @param {string} address - Ethereum address
 * @returns {Object} ENS data including name, avatar, and text records
 */
export const useENS = (address) => {
  const publicClient = usePublicClient();
  const [ensData, setEnsData] = useState({
    name: null,
    avatar: null,
    description: null,
    twitter: null,
    github: null,
    url: null,
    email: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchENSData = async () => {
      if (!publicClient || !address) {
        setEnsData({
          name: null,
          avatar: null,
          description: null,
          twitter: null,
          github: null,
          url: null,
          email: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        setEnsData(prev => ({ ...prev, isLoading: true, error: null }));

        // Get ENS name for the address
        const ensName = await publicClient.getEnsName({ address });
        
        if (!mounted) return;

        if (!ensName) {
          setEnsData({
            name: null,
            avatar: null,
            description: null,
            twitter: null,
            github: null,
            url: null,
            email: null,
            isLoading: false,
            error: null,
          });
          return;
        }

        // Fetch avatar and text records in parallel
        const [avatar, description, twitter, github, url, email] = await Promise.allSettled([
          publicClient.getEnsAvatar({ name: normalize(ensName) }).catch(() => null),
          publicClient.getEnsText({ name: normalize(ensName), key: 'description' }).catch(() => null),
          publicClient.getEnsText({ name: normalize(ensName), key: 'com.twitter' }).catch(() => null),
          publicClient.getEnsText({ name: normalize(ensName), key: 'com.github' }).catch(() => null),
          publicClient.getEnsText({ name: normalize(ensName), key: 'url' }).catch(() => null),
          publicClient.getEnsText({ name: normalize(ensName), key: 'email' }).catch(() => null),
        ]);

        if (!mounted) return;

        setEnsData({
          name: ensName,
          avatar: avatar.status === 'fulfilled' ? avatar.value : null,
          description: description.status === 'fulfilled' ? description.value : null,
          twitter: twitter.status === 'fulfilled' ? twitter.value : null,
          github: github.status === 'fulfilled' ? github.value : null,
          url: url.status === 'fulfilled' ? url.value : null,
          email: email.status === 'fulfilled' ? email.value : null,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('ENS lookup error:', error);
        if (!mounted) return;
        
        setEnsData({
          name: null,
          avatar: null,
          description: null,
          twitter: null,
          github: null,
          url: null,
          email: null,
          isLoading: false,
          error: error.message,
        });
      }
    };

    fetchENSData();

    return () => {
      mounted = false;
    };
  }, [publicClient, address]);

  return ensData;
};
