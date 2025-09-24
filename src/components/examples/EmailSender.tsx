import React, { useState } from 'react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function EmailSender() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [emailType, setEmailType] = useState<'welcome' | 'notification' | 'custom'>('welcome');

  const welcomeEmail = api.email.sendWelcome.useMutation({
    onSuccess: () => {
      toast.success('Welcome email sent successfully!');
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to send welcome email: ${error.message}`);
    },
  });

  const notificationEmail = api.email.sendNotification.useMutation({
    onSuccess: () => {
      toast.success('Notification email sent successfully!');
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to send notification email: ${error.message}`);
    },
  });

  const customEmail = api.email.sendCustom.useMutation({
    onSuccess: () => {
      toast.success('Custom email sent successfully!');
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to send custom email: ${error.message}`);
    },
  });

  const resetForm = () => {
    setEmail('');
    setName('');
    setMessage('');
    setSubject('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Email is required');
      return;
    }

    switch (emailType) {
      case 'welcome':
        if (!name) {
          toast.error('Name is required for welcome emails');
          return;
        }
        welcomeEmail.mutate({ email, name });
        break;

      case 'notification':
        if (!name || !message) {
          toast.error('Name and message are required for notification emails');
          return;
        }
        notificationEmail.mutate({ 
          email, 
          name, 
          message,
          // You can add action link and text here if needed
        });
        break;

      case 'custom':
        if (!subject || !message) {
          toast.error('Subject and message are required for custom emails');
          return;
        }
        // For simplicity, we're using the message as both text and HTML content
        customEmail.mutate({ 
          email, 
          subject, 
          text: message,
          html: `<div style="font-family: Arial, sans-serif;">${message.replace(/\n/g, '<br>')}</div>`
        });
        break;
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-center">Send Email</h2>
      
      <div className="mb-4 flex space-x-4">
        <Button 
          variant={emailType === 'welcome' ? 'default' : 'outline'}
          onClick={() => setEmailType('welcome')}
          className="flex-1"
        >
          Welcome
        </Button>
        <Button 
          variant={emailType === 'notification' ? 'default' : 'outline'}
          onClick={() => setEmailType('notification')}
          className="flex-1"
        >
          Notification
        </Button>
        <Button 
          variant={emailType === 'custom' ? 'default' : 'outline'}
          onClick={() => setEmailType('custom')}
          className="flex-1"
        >
          Custom
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Recipient Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="recipient@example.com"
            required
          />
        </div>

        {(emailType === 'welcome' || emailType === 'notification') && (
          <div>
            <Label htmlFor="name">Recipient Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
        )}

        {emailType === 'custom' && (
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email Subject"
              required
            />
          </div>
        )}

        {(emailType === 'notification' || emailType === 'custom') && (
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message here..."
              rows={4}
              required
            />
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={
            welcomeEmail.isPending || 
            notificationEmail.isPending || 
            customEmail.isPending
          }
        >
          {welcomeEmail.isPending || notificationEmail.isPending || customEmail.isPending
            ? 'Sending...'
            : 'Send Email'}
        </Button>
      </form>
    </div>
  );
}
